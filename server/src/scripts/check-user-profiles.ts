import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

async function checkUserProfileImages() {
  console.log('🔍 Checking User Profile Images...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userModel = app.get('UserModel') as Model<User>;

    // Get all users
    const users = await userModel.find({}).exec();
    console.log(`👥 Total users found: ${users.length}\n`);

    let usersWithImages = 0;
    let oldCloudImages = 0;
    let newCloudImages = 0;
    let otherImages = 0;

    console.log('📋 Users with profile images:');
    console.log('================================');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      if (user.profileImagePath) {
        usersWithImages++;
        console.log(`${usersWithImages}. ${user.name} (${user.email})`);
        console.log(`   📷 Image: ${user.profileImagePath}`);

        if (user.profileImagePath.includes('dsufx8uzd')) {
          oldCloudImages++;
          console.log(`   🔄 OLD CLOUD - needs migration`);
        } else if (user.profileImagePath.includes('dcnz1iv0m')) {
          newCloudImages++;
          console.log(`   ✅ NEW CLOUD - already migrated`);
        } else {
          otherImages++;
          console.log(`   🌍 OTHER SOURCE`);
        }
        console.log('');
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('=============');
    console.log(`👥 Total users: ${users.length}`);
    console.log(`🖼️  Users with profile images: ${usersWithImages}`);
    console.log(`🔄 Old cloud images: ${oldCloudImages}`);
    console.log(`✅ New cloud images: ${newCloudImages}`);
    console.log(`🌍 Other sources: ${otherImages}`);

    if (oldCloudImages > 0) {
      console.log('\n🚀 Migration needed for profile images!');
    } else if (usersWithImages === 0) {
      console.log('\n💡 No users have profile images yet.');
    } else {
      console.log(
        '\n✅ All profile images are already using new cloud or other sources!',
      );
    }
  } catch (error) {
    console.error('💥 Error checking users:', error);
  } finally {
    await app.close();
  }
}

// Run check
checkUserProfileImages()
  .then(() => {
    console.log('\n🏁 User profile check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User profile check failed:', error);
    process.exit(1);
  });
