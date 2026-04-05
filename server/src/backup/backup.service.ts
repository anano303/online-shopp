import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private transporter: nodemailer.Transporter;

  // Gmail-ის attachment ლიმიტი 25MB, უსაფრთხოებისთვის 20MB ვიყენებთ
  private readonly MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // ყოველი თვის 1-სა და 15-ში, დილის 3:00-ზე
  @Cron('0 3 1,15 * *')
  async handleBackupCron() {
    this.logger.log('🔄 ავტომატური backup დაიწყო...');
    try {
      await this.createAndSendBackup();
      this.logger.log('✅ Backup წარმატებით გაიგზავნა');
    } catch (error) {
      this.logger.error('❌ Backup-ის შექმნა/გაგზავნა ვერ მოხერხდა', error);
    }
  }

  /**
   * კოლექციის JSON ექსპორტი და ZIP-ში დაარქივება
   */
  private async exportCollectionToZip(
    db: any,
    collectionName: string,
  ): Promise<{ name: string; content: string } | null> {
    try {
      const documents = await db
        .collection(collectionName)
        .find({})
        .toArray();

      const jsonContent = JSON.stringify(documents, null, 2);
      this.logger.log(
        `  ✓ ${collectionName}: ${documents.length} დოკუმენტი`,
      );
      return { name: `${collectionName}.json`, content: jsonContent };
    } catch (error) {
      this.logger.warn(
        `  ⚠ ${collectionName} კოლექციის ექსპორტი ვერ მოხერხდა`,
        error,
      );
      return null;
    }
  }

  /**
   * ფაილების სიის ZIP buffer-ად გარდაქმნა
   */
  private async createZipBuffer(
    files: Array<{ name: string; content: string }>,
  ): Promise<Buffer> {
    const passThrough = new PassThrough();
    const archive = archiver.create('zip', { zlib: { level: 9 } });

    const chunks: Buffer[] = [];
    passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));

    const archiveFinished = new Promise<Buffer>((resolve, reject) => {
      passThrough.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    archive.pipe(passThrough);

    for (const file of files) {
      archive.append(file.content, { name: file.name });
    }

    await archive.finalize();
    return archiveFinished;
  }

  /**
   * ფაილებს ნაწილებად ყოფს, რომ თითოეული ZIP არ გადააჭარბოს ლიმიტს
   */
  private splitFilesIntoParts(
    files: Array<{ name: string; content: string }>,
  ): Array<Array<{ name: string; content: string }>> {
    const parts: Array<Array<{ name: string; content: string }>> = [];
    let currentPart: Array<{ name: string; content: string }> = [];
    let currentSize = 0;

    // კომპრესიის სავარაუდო კოეფიციენტი JSON-ისთვის (~85% კომპრესია)
    const compressionRatio = 0.15;

    for (const file of files) {
      const estimatedCompressedSize = Buffer.byteLength(file.content) * compressionRatio;

      // თუ ერთი ფაილი თავისთავად დიდია, ცალკე ნაწილში გადავა
      if (currentPart.length > 0 && currentSize + estimatedCompressedSize > this.MAX_ATTACHMENT_SIZE) {
        parts.push(currentPart);
        currentPart = [];
        currentSize = 0;
      }

      currentPart.push(file);
      currentSize += estimatedCompressedSize;
    }

    if (currentPart.length > 0) {
      parts.push(currentPart);
    }

    return parts;
  }

  async createAndSendBackup(): Promise<void> {
    const db = this.connection.db;
    if (!db) {
      throw new Error('Database connection is not available');
    }

    const collections = await db.listCollections().toArray();
    const date = new Date().toISOString().slice(0, 10);
    const adminEmail = process.env.EMAIL_USER;

    this.logger.log(
      `📦 ${collections.length} კოლექციის ექსპორტი დაიწყო...`,
    );

    // ყველა კოლექციის ექსპორტი
    const exportedFiles: Array<{ name: string; content: string }> = [];
    for (const collectionInfo of collections) {
      const result = await this.exportCollectionToZip(db, collectionInfo.name);
      if (result) {
        exportedFiles.push(result);
      }
    }

    // ჯერ ვცდით ერთ ZIP-ში მოთავსებას
    const fullZipBuffer = await this.createZipBuffer(exportedFiles);
    const totalSizeMB = (fullZipBuffer.length / 1024 / 1024).toFixed(2);

    this.logger.log(`📧 სრული ZIP ფაილის ზომა: ${totalSizeMB} MB`);

    if (fullZipBuffer.length <= this.MAX_ATTACHMENT_SIZE) {
      // ერთ მეილში ეტევა
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        to: adminEmail,
        subject: `🗄️ 13 Database Backup - ${date}`,
        html: `
          <h2>13 Database Backup</h2>
          <p><strong>თარიღი:</strong> ${date}</p>
          <p><strong>კოლექციები:</strong> ${collections.length}</p>
          <p><strong>ფაილის ზომა:</strong> ${totalSizeMB} MB</p>
          <p>ZIP ფაილი მოიცავს ყველა კოლექციის JSON ექსპორტს.</p>
        `,
        attachments: [
          {
            filename: `13-backup-${date}.zip`,
            content: fullZipBuffer,
            contentType: 'application/zip',
          },
        ],
      });

      this.logger.log(`✅ Backup გაიგზავნა 1 მეილით: ${adminEmail}`);
    } else {
      // ნაწილებად დაყოფა და ცალ-ცალკე გაგზავნა
      const parts = this.splitFilesIntoParts(exportedFiles);
      this.logger.log(
        `📦 Backup ძალიან დიდია (${totalSizeMB} MB), ${parts.length} ნაწილად იგზავნება...`,
      );

      for (let i = 0; i < parts.length; i++) {
        const partZipBuffer = await this.createZipBuffer(parts[i]);
        const partSizeMB = (partZipBuffer.length / 1024 / 1024).toFixed(2);
        const collectionsInPart = parts[i].map((f) => f.name.replace('.json', '')).join(', ');

        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@example.com',
          to: adminEmail,
          subject: `🗄️ 13 Database Backup - ${date} [ნაწილი ${i + 1}/${parts.length}]`,
          html: `
            <h2>13 Database Backup</h2>
            <p><strong>თარიღი:</strong> ${date}</p>
            <p><strong>ნაწილი:</strong> ${i + 1} / ${parts.length}</p>
            <p><strong>ფაილის ზომა:</strong> ${partSizeMB} MB</p>
            <p><strong>კოლექციები ამ ნაწილში:</strong> ${parts[i].length}</p>
            <p><small>${collectionsInPart}</small></p>
          `,
          attachments: [
            {
              filename: `13-backup-${date}-part${i + 1}.zip`,
              content: partZipBuffer,
              contentType: 'application/zip',
            },
          ],
        });

        this.logger.log(
          `  📧 ნაწილი ${i + 1}/${parts.length} გაიგზავნა (${partSizeMB} MB)`,
        );
      }

      this.logger.log(
        `✅ Backup გაიგზავნა ${parts.length} ნაწილად: ${adminEmail}`,
      );
    }
  }
}
