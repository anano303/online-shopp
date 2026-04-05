import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FooterSettings,
  FooterSettingsDocument,
} from '../schemas/footer-settings.schema';
import {
  PrivacyPolicy,
  PrivacyPolicyDocument,
} from '../schemas/privacy-policy.schema';
import { AboutPage, AboutPageDocument } from '../schemas/about-page.schema';
import {
  TermsConditions,
  TermsConditionsDocument,
} from '../schemas/terms-conditions.schema';
import {
  ReturnPolicy,
  ReturnPolicyDocument,
} from '../schemas/return-policy.schema';
import { UpdateFooterSettingsDto } from '../dtos/update-footer-settings.dto';
import { UpdatePrivacyPolicyDto } from '../dtos/update-privacy-policy.dto';
// import { UpdateAboutPageDto } from '../dtos/update-about-page.dto';
import { UpdateTermsConditionsDto } from '../dtos/update-terms-conditions.dto';
import { UpdateReturnPolicyDto } from '../dtos/update-return-policy.dto';

import { UpdateAboutPageDto } from '../dtos/update-about-page.dto';

const DEFAULT_ABOUT_SECTIONS = [
  {
    text: 'ცამეტი არის მამაკაცების კლასიკური ტანსაცმლის მაღაზია საქართველოში. ჩვენი მიზანია, შევთავაზოთ უმაღლესი ხარისხის კოსტიუმები, პერანგები, ქურთუკები და აქსესუარები, რომელიც დააკმაყოფილებს თანამედროვე მამაკაცის გემოვნებას.',
    textEn:
      "ცამეტი is a men's classic clothing store in Georgia. Our goal is to offer the highest quality suits, shirts, jackets and accessories that satisfy the modern man's taste.",
    type: 'normal',
  },
  {
    text: 'წლების განმავლობაში, ჩვენ გავაფართოვეთ ჩვენი ასორტიმენტი და დავამყარეთ ურთიერთობები წამყვან ბრენდებთან, რათა შეგვეთავაზებინა უახლესი და სტილური ტანსაცმელი ჩვენი მომხმარებლებისთვის.',
    textEn:
      'Over the years, we have expanded our range and established relationships with leading brands to offer the latest and most stylish clothing to our customers.',
    type: 'normal',
  },
  {
    text: 'რატომ ცამეტი? გთავაზობთ 100+ ბრენდისგან შემდგარ ფართო ასორტიმენტს, პროფესიონალურ კონსულტაციას, სწრაფ მიწოდებას საქართველოს მასშტაბით და უმაღლესი ხარისხის გარანტიას.',
    textEn:
      'Why ცამეტი? We offer a wide assortment from 100+ brands, professional consultation, fast delivery throughout Georgia and highest quality guarantee.',
    type: 'highlight',
  },
  {
    text: 'ჩვენი მისიაა, შევთავაზოთ უმაღლესი ხარისხის მამაკაცების კლასიკური ტანსაცმელი, რომელიც დააკმაყოფილებს თანამედროვე მამაკაცის გემოვნებას. ჩვენი მიზანია, დავეხმაროთ ჩვენს მომხმარებლებს სტილური გარეგნობის შექმნაში.',
    textEn:
      "Our mission is to offer the highest quality men's classic clothing that satisfies the modern man's taste. Our goal is to help our customers create a stylish appearance.",
    type: 'normal',
  },
  {
    text: 'ხარისხი, სანდოობა, ინოვაცია — ეს ჩვენი ღირებულებებია',
    textEn: 'Quality, reliability, innovation — these are our values',
    type: 'quote',
  },
  {
    text: 'ცამეტი ვალდებულებას იღებს, მოგაწვდოთ არა მხოლოდ უმაღლესი ხარისხის პროდუქცია, არამედ გამორჩეული მომსახურებაც. ჩვენი გუნდი მზადაა, დაგეხმაროთ სწორი არჩევანის გაკეთებაში და გაგიზიაროთ თავისი ცოდნა და გამოცდილება.',
    textEn:
      'ცამეტი is committed to providing you not only with high-quality products but also with outstanding service. Our team is ready to help you make the right choice and share their knowledge and experience.',
    type: 'normal',
  },
  {
    text: 'ეწვიეთ ჩვენს მაღაზიას და აღმოაჩინეთ ხარისხიანი სტილი — ცამეტისთან ერთად!',
    textEn: 'Visit our store and discover quality style — with ცამეტი!',
    type: 'final',
  },
];

const DEFAULT_PRIVACY_SECTIONS = [
  {
    title: 'ინფორმაციის შეგროვება',
    titleEn: 'Information Collection',
    content:
      'თქვენგან ვაგროვებთ იმ ინფორმაციას, რომელსაც პირდაპირ გვაწვდით — მაგალითად, როცა ქმნით ანგარიშს, ასრულებთ შეძენას ან გვიკავშირდებით. ეს შეიძლება მოიცავდეს თქვენს სახელს, ელფოსტის მისამართს, ტელეფონის ნომერს, მიწოდების მისამართს და გადახდის ინფორმაციას.',
    contentEn:
      'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes your name, email address, phone number, shipping address, and payment information.',
    type: 'paragraph',
  },
  {
    title: 'როგორ ვიყენებთ თქვენს ინფორმაციას',
    titleEn: 'How We Use Your Information',
    content:
      'თქვენი შეკვეთების დამუშავება და შესრულება\nშეკვეთის დადასტურების და მიწოდების განახლებების გაგზავნა\nმომხმარებლის მხარდაჭერის უზრუნველყოფა\nჩვენი ვებსაიტის და სერვისების გაუმჯობესება\nსარეკლამო ელფოსტების გაგზავნა (თქვენი თანხმობით)',
    contentEn:
      'Process and fulfill your orders\nSend you order confirmations and shipping updates\nProvide customer support\nImprove our website and services\nSend promotional emails (with your consent)',
    type: 'list',
  },
  {
    title: 'ინფორმაციის გაზიარება',
    titleEn: 'Information Sharing',
    content:
      'ჩვენ არ ვყიდით, არ ვცვლით და არ ვაქირავებთ თქვენს პირად ინფორმაციას მესამე მხარეებისთვის. შეიძლება გავაზიაროთ თქვენი ინფორმაცია სანდო სერვის პროვაიდერებთან, რომლებიც გვეხმარებიან ჩვენი ბიზნესის მართვაში, როგორიცაა გადახდის დამუშავებისა და მიწოდების კომპანიები, მაგრამ მხოლოდ იმ ფარგლებში, რომელიც საჭიროა ჩვენი სერვისების უზრუნველსაყოფად.',
    contentEn:
      'We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who help us operate our business, such as payment processors and shipping companies, but only to the extent necessary to provide our services.',
    type: 'paragraph',
  },
  {
    title: 'მონაცემთა უსაფრთხოება',
    titleEn: 'Data Security',
    content:
      'ჩვენ ვახორციელებთ შესაბამის უსაფრთხოების ზომებს თქვენი პირადი ინფორმაციის დასაცავად უნებართვო წვდომისგან, შეცვლისგან, გამჟღავნებისგან ან განადგურებისგან. თუმცა, ინტერნეტით გადაცემის არცერთი მეთოდი არ არის 100% უსაფრთხო.',
    contentEn:
      'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.',
    type: 'paragraph',
  },
  {
    title: 'ქუქიები',
    titleEn: 'Cookies',
    content:
      'ჩვენი ვებსაიტი იყენებს ქუქიებს თქვენი დათვალიერების გამოცდილების გასაუმჯობესებლად, თქვენი პრეფერენსების დასამახსოვრებლად და ვებსაიტის ტრაფიკის გასაანალიზებლად. შეგიძლიათ გამორთოთ ქუქიები თქვენი ბრაუზერის პარამეტრებში, მაგრამ ეს შეიძლება იმოქმედოს ჩვენი ვებსაიტის ფუნქციონალზე.',
    contentEn:
      'Our website uses cookies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can disable cookies in your browser settings, but this may affect the functionality of our website.',
    type: 'paragraph',
  },
  {
    title: 'თქვენი უფლებები',
    titleEn: 'Your Rights',
    content:
      'გაქვთ უფლება, იხილოთ, განაახლოთ ან წაშალოთ თქვენი პირადი ინფორმაცია. ასევე შეგიძლიათ ნებისმიერ დროს გააუქმოთ სარეკლამო ელფოსტების მიღება. აღნიშნული უფლებების გამოსაყენებლად, გთხოვთ დაგვიკავშირდეთ ქვემოთ მოცემული საკონტაქტო ინფორმაციის გამოყენებით.',
    contentEn:
      'You have the right to access, update, or delete your personal information. You can also unsubscribe from promotional emails at any time. To exercise these rights, please contact us using the information provided below.',
    type: 'paragraph',
  },
  {
    title: 'საკონტაქტო ინფორმაცია',
    titleEn: 'Contact Information',
    content:
      'თუ გაქვთ რაიმე კითხვა ამ კონფიდენციალურობის პოლიტიკასთან დაკავშირებით, გთხოვთ დაგვიკავშირდეთ:\nEmail: kakhaber.shop13@gmail.com\nტელეფონი: +995 574150531\nმისამართი: თბილისი, საქართველო',
    contentEn:
      'If you have any questions about this Privacy Policy, please contact us at:\nEmail: kakhaber.shop13@gmail.com\nPhone: +995 574150531\nAddress: Tbilisi, Georgia',
    type: 'paragraph',
  },
  {
    title: 'ცვლილებები ამ პოლიტიკაში',
    titleEn: 'Changes to This Policy',
    content:
      'ჩვენ შეიძლება პერიოდულად განვაახლოთ კონფიდენციალურობის პოლიტიკა. ჩვენ შეგატყობინებთ ნებისმიერი ცვლილების შესახებ ამ გვერდზე ახალი კონფიდენციალურობის პოლიტიკის განთავსებით და ამოქმედების თარიღის განახლებით.',
    contentEn:
      'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date.',
    type: 'paragraph',
  },
];

const DEFAULT_TERMS_SECTIONS = [
  {
    title: 'შესავალი',
    titleEn: 'Introduction',
    content:
      'მოგესალმებით ცამეტიზე — თქვენი სანდო პარტნიორი მამაკაცების კლასიკური ტანსაცმლის შესყიდვაში საქართველოში. ჩვენი ვებსაიტის გამოყენებით, თქვენ ეთანხმებით ამ წესებსა და პირობებს. გთხოვთ, ყურადღებით წაიკითხოთ ისინი ნებისმიერი შესყიდვის განხორციელებამდე.',
    contentEn:
      "Welcome to ცამეტი — your trusted partner for men's classic clothing in Georgia. By using our website, you agree to these terms and conditions. Please read them carefully before making any purchase.",
    type: 'paragraph',
  },
  {
    title: 'პროდუქციის შესახებ',
    titleEn: 'Product Information',
    content:
      'ცამეტი გთავაზობთ მამაკაცების კლასიკური ტანსაცმლის ფართო ასორტიმენტს, მათ შორის კოსტიუმებს, პერანგებს, ქურთუკებს და აქსესუარებს. ჩვენს ვებსაიტზე განთავსებული ყველა პროდუქტი აღწერილია ჩვენი ცოდნის საუკეთესო საფუძველზე. თუმცა, შესაძლოა გამოვლინდეს მცირე განსხვავებები ფერში, ზომაში ან მახასიათებლებში.',
    contentEn:
      "ცამეტი offers a wide range of men's classic clothing, including suits, shirts, jackets and accessories. All products listed on our website are accurately described to the best of our knowledge. However, slight variations in color, size, or specifications may occur.",
    type: 'paragraph',
  },
  {
    title: 'შეკვეთა და გადახდა',
    titleEn: 'Orders and Payment',
    content:
      'შეკვეთის გაფორმებისას თქვენ ადასტურებთ, რომ მოწოდებული ინფორმაცია სწორია.\nგადახდა ხორციელდება ონლაინ საბანკო ბარათით.\nშეკვეთა დადასტურებულად ითვლება გადახდის წარმატებით შესრულების შემდეგ.\nჩვენ ვიტოვებთ უფლებას უარი ვთქვათ ნებისმიერ შეკვეთაზე.',
    contentEn:
      'By placing an order, you confirm that the information provided is correct.\nPayment is made online via bank card.\nAn order is considered confirmed after successful payment.\nWe reserve the right to refuse any order.',
    type: 'list',
  },
  {
    title: 'მიწოდება',
    titleEn: 'Delivery',
    content:
      'მიწოდება ხორციელდება საქართველოს მასშტაბით. მიწოდების ვადა დამოკიდებულია თქვენს მდებარეობაზე და შეიძლება იყოს 1-5 სამუშაო დღე. სტანდარტული მიწოდება გრძელდება 3-5 სამუშაო დღე თბილისში და 7 სამუშაო დღემდე სხვა რეგიონებში.',
    contentEn:
      'Delivery is available throughout Georgia. Delivery time depends on your location and may take 1-5 business days. Standard delivery takes 3-5 business days in Tbilisi and up to 7 business days in other regions.',
    type: 'paragraph',
  },
  {
    title: 'ინტელექტუალური საკუთრება',
    titleEn: 'Intellectual Property',
    content:
      'ვებგვერდზე განთავსებული ყველა შინაარსი, მათ შორის ტექსტები, სურათები, ლოგოები, დიზაინი და პროგრამული უზრუნველყოფა, წარმოადგენს ჩვენს ინტელექტუალურ საკუთრებას და დაცულია საავტორო უფლებების კანონმდებლობით.',
    contentEn:
      'All content on this website, including text, images, logos, designs, and software, is our intellectual property and is protected by copyright law.',
    type: 'paragraph',
  },
  {
    title: 'პასუხისმგებლობის შეზღუდვა',
    titleEn: 'Limitation of Liability',
    content:
      'ჩვენ არ ვიღებთ პასუხისმგებლობას ნებისმიერ ზიანზე, რომელიც შეიძლება წარმოიშვას ვებგვერდის გამოყენების შედეგად. ვებგვერდი მოწოდებულია "როგორც არის" პრინციპით.',
    contentEn:
      'We are not liable for any damages that may arise from the use of this website. The website is provided on an "as is" basis.',
    type: 'paragraph',
  },
  {
    title: 'ცვლილებები პირობებში',
    titleEn: 'Changes to Terms',
    content:
      'ჩვენ ვიტოვებთ უფლებას ნებისმიერ დროს შევცვალოთ ეს წესები და პირობები. ცვლილებები ძალაში შედის ვებგვერდზე გამოქვეყნებისთანავე. გირჩევთ, პერიოდულად გადახედოთ ამ გვერდს.',
    contentEn:
      'We reserve the right to modify these Terms and Conditions at any time. Changes take effect immediately upon publication on the website. We recommend reviewing this page periodically.',
    type: 'paragraph',
  },
  {
    title: 'საკონტაქტო ინფორმაცია',
    titleEn: 'Contact Information',
    content:
      'თუ გაქვთ კითხვები ამ წესებთან და პირობებთან დაკავშირებით, გთხოვთ დაგვიკავშირდეთ:\nEmail: kakhaber.shop13@gmail.com\nტელეფონი: +995 574150531\nმისამართი: თბილისი, საქართველო',
    contentEn:
      'If you have any questions about these Terms and Conditions, please contact us:\nEmail: kakhaber.shop13@gmail.com\nPhone: +995 574150531\nAddress: Tbilisi, Georgia',
    type: 'paragraph',
  },
];

const DEFAULT_RETURN_SECTIONS = [
  {
    title: 'დაბრუნების პირობები',
    titleEn: 'Return Conditions',
    content:
      'პროდუქტის დაბრუნება შესაძლებელია მიღებიდან 14 დღის განმავლობაში. დაბრუნებული პროდუქტი უნდა იყოს ორიგინალ შეფუთვაში, გამოუყენებელი და დაუზიანებელი.',
    contentEn:
      'Products can be returned within 14 days of receipt. The returned product must be in its original packaging, unused, and undamaged.',
    type: 'paragraph',
  },
  {
    title: 'დაბრუნების პროცესი',
    titleEn: 'Return Process',
    content:
      'დაგვიკავშირდით ელ-ფოსტაზე ან ტელეფონით დაბრუნების მოთხოვნით\nმიუთითეთ შეკვეთის ნომერი და დაბრუნების მიზეზი\nჩვენ მოგაწვდით დაბრუნების ინსტრუქციებს\nპროდუქტი უნდა გამოგზავნოთ ჩვენს მისამართზე',
    contentEn:
      'Contact us via email or phone with your return request\nProvide the order number and reason for return\nWe will provide you with return instructions\nThe product must be shipped to our address',
    type: 'list',
  },
  {
    title: 'თანხის დაბრუნება',
    titleEn: 'Refunds',
    content:
      'პროდუქტის მიღებისა და შემოწმების შემდეგ, თანხა დაგიბრუნდებათ იმავე გადახდის მეთოდით, რომლითაც შეძენა განხორციელდა. თანხის დაბრუნება ხდება 5-10 სამუშაო დღის განმავლობაში.',
    contentEn:
      'After receiving and inspecting the product, a refund will be issued to the same payment method used for the purchase. Refunds are processed within 5-10 business days.',
    type: 'paragraph',
  },
  {
    title: 'გამონაკლისები',
    titleEn: 'Exceptions',
    content:
      'ფასდაკლებით შეძენილი პროდუქტები არ ექვემდებარება დაბრუნებას\nპერსონალიზებული პროდუქტები არ ექვემდებარება დაბრუნებას\nგამოყენებული ან დაზიანებული პროდუქტები არ მიიღება უკან',
    contentEn:
      'Discounted products are not eligible for returns\nPersonalized products are not eligible for returns\nUsed or damaged products will not be accepted',
    type: 'list',
  },
  {
    title: 'გაცვლა',
    titleEn: 'Exchanges',
    content:
      'პროდუქტის გაცვლა შესაძლებელია სხვა ზომაზე ან ფერზე, თუ სასურველი ვარიანტი ხელმისაწვდომია. გაცვლის მოთხოვნა უნდა წარადგინოთ პროდუქტის მიღებიდან 14 დღის განმავლობაში.',
    contentEn:
      'Products can be exchanged for a different size or color if the desired option is available. Exchange requests must be submitted within 14 days of receiving the product.',
    type: 'paragraph',
  },
  {
    title: 'საკონტაქტო ინფორმაცია',
    titleEn: 'Contact Information',
    content:
      'დაბრუნებასთან დაკავშირებით, გთხოვთ დაგვიკავშირდეთ:\nEmail: kakhaber.shop13@gmail.com\nტელეფონი: +995 574150531\nმისამართი: თბილისი, საქართველო',
    contentEn:
      'For return-related inquiries, please contact us:\nEmail: kakhaber.shop13@gmail.com\nPhone: +995 574150531\nAddress: Tbilisi, Georgia',
    type: 'paragraph',
  },
];

const DEFAULT_TEAM_MEMBERS = [
  {
    name: 'გიორგი მაისურაძე',
    nameEn: 'Giorgi Maisuradze',
    position: 'დამფუძნებელი & CEO',
    positionEn: 'Founder & CEO',
    bio: 'გიორგი არის გამოცდილი მეწარმე 15+ წლიანი გამოცდილებით. მისი სიყვარული მოდისა და სტილის მიმართ გახდა ცამეტის შექმნის მთავარი მიზეზი.',
    bioEn:
      'Giorgi is an experienced entrepreneur with 15+ years of experience. His passion for fashion and style became the main reason for creating ცამეტი.',
    image: '',
  },
];

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(FooterSettings.name)
    private footerSettingsModel: Model<FooterSettingsDocument>,
    @InjectModel(PrivacyPolicy.name)
    private privacyPolicyModel: Model<PrivacyPolicyDocument>,
    @InjectModel(AboutPage.name)
    private aboutPageModel: Model<AboutPageDocument>,
    @InjectModel(TermsConditions.name)
    private termsConditionsModel: Model<TermsConditionsDocument>,
    @InjectModel(ReturnPolicy.name)
    private returnPolicyModel: Model<ReturnPolicyDocument>,
  ) {}

  async getFooterSettings(): Promise<FooterSettingsDocument> {
    let settings = await this.footerSettingsModel.findOne();
    if (!settings) {
      settings = await this.footerSettingsModel.create({});
    }
    return settings;
  }

  async updateFooterSettings(
    dto: UpdateFooterSettingsDto,
  ): Promise<FooterSettingsDocument> {
    let settings = await this.footerSettingsModel.findOne();
    if (!settings) {
      settings = await this.footerSettingsModel.create(dto);
    } else {
      Object.assign(settings, dto);
      await settings.save();
    }
    return settings;
  }

  async getAboutPage(): Promise<AboutPageDocument> {
    let about = await this.aboutPageModel.findOne();
    if (!about) {
      about = await this.aboutPageModel.create({
        sections: DEFAULT_ABOUT_SECTIONS,
        teamMembers: DEFAULT_TEAM_MEMBERS,
      });
    }
    return about;
  }

  async updateAboutPage(dto: UpdateAboutPageDto): Promise<AboutPageDocument> {
    let about = await this.aboutPageModel.findOne();
    if (!about) {
      about = await this.aboutPageModel.create(dto);
    } else {
      Object.assign(about, dto);
      await about.save();
    }
    return about;
  }

  async getPrivacyPolicy(): Promise<PrivacyPolicyDocument> {
    let policy = await this.privacyPolicyModel.findOne();
    if (!policy) {
      policy = await this.privacyPolicyModel.create({
        sections: DEFAULT_PRIVACY_SECTIONS,
      });
    }
    return policy;
  }

  async updatePrivacyPolicy(
    dto: UpdatePrivacyPolicyDto,
  ): Promise<PrivacyPolicyDocument> {
    let policy = await this.privacyPolicyModel.findOne();
    if (!policy) {
      policy = await this.privacyPolicyModel.create(dto);
    } else {
      Object.assign(policy, dto);
      await policy.save();
    }
    return policy;
  }

  async getTermsConditions(): Promise<TermsConditionsDocument> {
    let terms = await this.termsConditionsModel.findOne();
    if (!terms) {
      terms = await this.termsConditionsModel.create({
        sections: DEFAULT_TERMS_SECTIONS,
      });
    }
    return terms;
  }

  async updateTermsConditions(
    dto: UpdateTermsConditionsDto,
  ): Promise<TermsConditionsDocument> {
    let terms = await this.termsConditionsModel.findOne();
    if (!terms) {
      terms = await this.termsConditionsModel.create(dto);
    } else {
      Object.assign(terms, dto);
      await terms.save();
    }
    return terms;
  }

  async getReturnPolicy(): Promise<ReturnPolicyDocument> {
    let policy = await this.returnPolicyModel.findOne();
    if (!policy) {
      policy = await this.returnPolicyModel.create({
        sections: DEFAULT_RETURN_SECTIONS,
      });
    }
    return policy;
  }

  async updateReturnPolicy(
    dto: UpdateReturnPolicyDto,
  ): Promise<ReturnPolicyDocument> {
    let policy = await this.returnPolicyModel.findOne();
    if (!policy) {
      policy = await this.returnPolicyModel.create(dto);
    } else {
      Object.assign(policy, dto);
      await policy.save();
    }
    return policy;
  }
}
