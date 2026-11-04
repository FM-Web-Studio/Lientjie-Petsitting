// The privacy policy and terms. Plain data so the wording lives in one place.
// A block is a paragraph (string) or a bullet list (array). [text](url) becomes a link.
// Change LEGAL_UPDATED whenever the meaning of either document changes.

export const LEGAL_UPDATED = '4 November 2026';

// reCAPTCHA only loads once App Check has a site key, so the policy only mentions it then.
const SPAM_CHECK = Boolean(import.meta.env.FIREBASE_APPCHECK_SITE_KEY);

const reachLine = ({ email, phone }) => {
  const ways = [
    email && `by email at [${email}](mailto:${email})`,
    phone && `by phone on ${phone}`,
    'through the [contact page](/contact)',
  ].filter(Boolean);
  return ways.length > 1 ? `${ways.slice(0, -1).join(', ')} or ${ways[ways.length - 1]}` : ways[0];
};

export const privacyPolicy = (who) => ({
  title: 'Privacy policy',
  intro: `What ${who.brand} collects about you, why, and what you can do about it. The short version: no tracking, no advertising, nothing sold. If you send an enquiry, it is used to reply to you. If you write a review, it is shown on the site with the name you give.`,
  sections: [
    {
      heading: 'Who is responsible',
      blocks: [
        `${who.brand} is run by ${who.owner}, based in ${who.location}. She is the responsible party for your personal information under the Protection of Personal Information Act, 2013 (POPIA), and the controller for the purposes of the EU and UK GDPR. You can reach her ${reachLine(who)}.`,
        'The website was built and is looked after by Francois Meiring, who acts as her operator under POPIA. He handles personal information only on her behalf and only to keep the site running, and is bound to keep it confidential and secure.',
      ],
    },
    {
      heading: 'What is collected',
      blocks: [
        [
          'When you send an enquiry through the Contact page: your name, email address and message, plus anything you choose to add (phone number, your pet\'s name and type, and the service you are interested in), and the time it was sent.',
          'When you write a review: the name you want shown, your star rating, the review text, and anything you choose to add (a headline, your pet\'s name and the service you used), and the time it was sent. No email address or phone number is asked for.',
          'When you comment on a review: the name you want shown, your comment and the time it was sent.',
          'When you like a review or comment: the counter goes up, and a one-way code made from your network (IP) address and that review or comment is kept, so the same person cannot like it twice. The code cannot be turned back into your address, and it is deleted after 12 months, or straight away if you unlike.',
          'To stop the forms being used for spam, the site also keeps short one-way codes made from your network (IP) address and, for enquiries, your email address, so it can count how many posts arrive from one place. The codes cannot be turned back into the originals, and they are deleted after 24 hours.',
        ],
        'When you visit any page, the site is served by Google Firebase Hosting, which, like every web host, receives your IP address, browser details and the page requested in order to deliver it. There are no analytics, advertising or tracking scripts, and no profile of you is built.',
        'Please do not include special personal information (such as health, religion or political views) or information about children in a message, review or comment, and please do not write about other people in a way that identifies them.',
      ],
    },
    {
      heading: 'Why it is used',
      blocks: [
        [
          'Enquiries: to reply to you and, if you want to go ahead, to arrange care for your pet. The basis is your request and the steps needed to agree a booking with you (POPIA section 11(1)(a) and (b); GDPR article 6(1)(b)).',
          'Reviews and comments: to publish them on the site, because you asked for that (POPIA section 11(1)(a); GDPR article 6(1)(a)). You can ask for yours to be taken down at any time.',
          'Keeping the site running and secure, for example stopping the forms being used for spam. The basis is the legitimate interest in a working, safe site (POPIA section 11(1)(f); GDPR article 6(1)(f)).',
        ],
        'Your information is never sold, rented or traded, and is not used for marketing lists. You will not be added to a mailing list.',
      ],
    },
    {
      heading: 'Reviews and comments are public',
      blocks: [
        'Every review and comment is read before it is published. Once published, it is shown on this site to anyone, with the name you gave, the date, and for reviews the rating and any details you added. A short selection of reviews also appears on the home page. A first name or initials is enough.',
        'Anything that is published can be seen, and copied, by other people. If you change your mind, ask and it will be removed from the site. Reviews and comments that are not published are never shown.',
      ],
    },
    {
      heading: 'Where it goes',
      blocks: [
        [
          'Google (Firebase and Google Cloud) stores enquiries, reviews and comments in a database in Belgium (europe-west1) and hosts the site. A small program in the same region checks each enquiry, review and comment for spam before saving it. See [Google\'s privacy policy](https://policies.google.com/privacy).',
          `Google (Gmail) delivers a copy of each new enquiry, and of each new review waiting to be checked, to ${who.owner}'s inbox so she can reply or publish it.`,
          'Google Fonts supplies the site\'s typeface, so your browser contacts Google\'s servers when a page loads.',
          ...(SPAM_CHECK ? ['Google reCAPTCHA checks that the forms are being used by a person and not a bot. It looks at how the page is used and may set its own cookies. The [Google privacy policy](https://policies.google.com/privacy) and [terms](https://policies.google.com/terms) apply to it.'] : []),
        ],
        'Some of these providers store or process information outside South Africa. They are relied on because they are bound by data-protection terms that give protection comparable to POPIA (POPIA section 72), including the EU Standard Contractual Clauses where they apply.',
        'Links to Instagram, Facebook or WhatsApp only contact those services when you follow them, and their own policies then apply.',
        'Your information is not shared with anyone else unless the law requires it.',
      ],
    },
    {
      heading: 'How long it is kept',
      blocks: [
        'Enquiries are deleted automatically 12 months after they arrive, and the email copy is deleted on the same schedule. If you book a service, what is needed for that booking is kept only for as long as the booking, and any legal record-keeping duty, requires. The spam-check codes described above are deleted after 24 hours, and the like codes after 12 months.',
        'Published reviews and comments stay on the site until you ask for them to be removed or they are taken down. Ones that are not published are deleted.',
      ],
    },
    {
      heading: 'Cookies and local storage',
      blocks: [
        'This site sets no cookies of its own. It saves a few small things in your browser\'s local storage: your light or dark theme, which reviews and comments you liked (so the heart stays filled in), and when you last posted a review (so the site can ask you to wait a few minutes before posting another). They never leave your device, and clearing your browser data removes them.',
        ...(SPAM_CHECK ? ['Google reCAPTCHA, described above, may set cookies of its own.'] : []),
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        'You may ask whether information about you is held, to see it, to correct it, or to delete it. You may object to its use and, where the GDPR applies, ask for it to be restricted or handed over in a portable form. Where you agreed to something, such as publishing a review, you can withdraw that at any time. Use the contact details above. You will get an answer within 30 days, free of charge.',
        'If you are unhappy with how your information was handled, you may complain to the [Information Regulator of South Africa](https://inforegulator.org.za). If you are in the EU or UK, you may also complain to your local data-protection authority. Please get in touch first, so it can be put right.',
      ],
    },
    {
      heading: 'Security',
      blocks: [
        'The site is served only over HTTPS. Enquiries and unpublished reviews can be read only by the site\'s administrators, enforced by the database\'s access rules and a signed-in, verified account. No system is perfectly secure, but if a breach ever affected your information you and the Information Regulator would be told, as POPIA requires.',
      ],
    },
    {
      heading: 'Children',
      blocks: [
        'This site is meant for adults arranging care for their pets. Information is not knowingly collected from anyone under 18. If you believe a child has sent their details, say so and they will be deleted.',
      ],
    },
    {
      heading: 'Changes',
      blocks: [
        'If this policy changes, the new version will be posted here with a new date at the top. Information you already sent will not be used in a way the policy did not allow when you sent it.',
      ],
    },
  ],
});

export const termsOfUse = (who) => ({
  title: 'Terms of use',
  intro: `The ground rules for using this website, and for the reviews and comments on it. By using the site you agree to them. If you do not, please do not use it.`,
  sections: [
    {
      heading: 'Who we are',
      blocks: [
        [
          `Name: ${who.brand}, run by ${who.owner}.`,
          `Area: ${who.location}.`,
          `Contact: ${reachLine(who)}.`,
          `Website: ${who.site}.`,
        ],
        'How personal information is handled is set out in the [privacy policy](/privacy).',
      ],
    },
    {
      heading: 'Services and bookings',
      blocks: [
        'The site describes the pet-care services on offer. It is an invitation to get in touch, not a booking. A booking is only confirmed when you and the business agree it directly, by message, email or phone, with the dates, the care your pet needs and the price set out in a quote. That agreement, and your rights under the Consumer Protection Act, 2008, govern the service itself.',
        'Prices on the Services page are for each service as described there, in South African rand. Anything beyond that, such as extra visits, longer distances or special care, is quoted before you book. The quote you accept is the price you pay.',
        'Availability is never guaranteed until a booking is confirmed.',
      ],
    },
    {
      heading: 'Reviews and comments',
      blocks: [
        'Honest reviews and comments, good or bad, are welcome from people who have used the services or have something useful to add. When you post one, you agree that:',
        [
          'it is your own, true experience and your honest opinion, and you are not being paid or rewarded for it, or posting for a competitor;',
          'it does not include personal information about anyone else, such as their full name, address, phone number or photographs, or anything about children;',
          'it is not abusive, threatening, discriminatory, obscene, defamatory or otherwise unlawful, and it is not advertising, spam or a link to another site;',
          'it does not copy someone else\'s words or break anyone\'s rights.',
        ],
        'Every review and comment is read before it is published. One that breaks these rules may be declined or removed. What you write is not edited: it is published as you wrote it, or not at all. Publishing a review does not mean the business agrees with it.',
        'You keep ownership of what you write. By posting it you give the business a free, non-exclusive permission to show it, with the name you gave, on this website for as long as it stays published. You can ask for your review or comment to be removed at any time and it will be taken down.',
        'Likes are a simple way to show appreciation, one per person for each review or comment. Please do not try to inflate them.',
      ],
    },
    {
      heading: 'Photos and content',
      blocks: [
        'The text, photographs, logo and design of this site belong to the business, or are used with permission, and all rights are reserved. You may view the site and share links to it. You may not copy its photos or text for your own use without written permission.',
        'If a photo of your pet appears in the gallery and you would like it removed, ask and it will be taken down.',
      ],
    },
    {
      heading: 'Acceptable use',
      blocks: [
        [
          'Do not use the forms to send spam, advertising, abuse, malware or anything unlawful.',
          'Do not try to break, overload or gain unauthorised access to the site, its database or its admin area.',
          'Do not use the site in a way that infringes anyone\'s rights.',
        ],
        'Messages, reviews, comments and traffic that break these rules may be blocked or deleted.',
      ],
    },
    {
      heading: 'Links to other sites',
      blocks: [
        'Links to Instagram, Facebook, WhatsApp and other sites take you to services the business does not control. It is not responsible for their content or how they handle your information.',
      ],
    },
    {
      heading: 'The website and liability',
      blocks: [
        'The information on the site is kept accurate and up to date in good faith. The website is provided free of charge and may be changed, paused or removed at any time.',
        'To the extent the law allows, the business is not liable for loss or damage caused by using the website itself, for example if it is unavailable or a page contains a mistake. This does not apply to the pet-care services, which are covered by your booking and the law. Nothing in these terms limits any right you have, or any responsibility the business has, under the Consumer Protection Act, 2008, or any other law that cannot be excluded.',
      ],
    },
    {
      heading: 'Law and changes',
      blocks: [
        'These terms are governed by the law of the Republic of South Africa, without taking away any protection you have under the law of the place you live. If any part is found unenforceable, the rest still applies.',
        'These terms may be updated. The version and date posted here apply from the time they are posted. They do not change a booking already agreed.',
      ],
    },
  ],
});
