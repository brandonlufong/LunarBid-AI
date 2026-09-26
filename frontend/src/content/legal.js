// frontend/src/content/legal.js
// Terms of Service, Privacy Policy and Refund Policy, in English and French.
// They describe what LunarBid does today. Update them whenever that changes
// (new data, new processors, pricing rules) and have them reviewed by counsel.
export const LEGAL_UPDATED = '2026-09-26';
export const SUPPORT_EMAIL = 'support@lunarbid.ai'; // TODO: confirm the support address

const en = {
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern your use of LunarBid, an AI-powered proposal platform operated by NWEE ("we", "us"). By creating an account or using LunarBid, you agree to them.',
    sections: [
      ['Your account', [
        'You must provide accurate information, keep your password secure and be at least 16 years old. You are responsible for activity on your account.',
      ]],
      ['Using LunarBid responsibly', [
        'LunarBid drafts proposals with artificial intelligence. AI output can be inaccurate or incomplete. You are responsible for reviewing every proposal before you send it, and for everything you send to clients.',
        'Do not use LunarBid to claim experience, qualifications or work you do not have, to send spam, to break the rules of the platforms you bid on, or to process content you do not have the right to use.',
        'Do not attempt to disrupt the service, access other accounts, bypass usage limits or extract content in bulk by automated means.',
      ]],
      ['Your content', [
        'You own the job posts, profiles and proposals you add or create. You give us permission to store and process them only to provide the service to you, including sending them to our AI providers to generate results.',
        'Proposals you share by link can be viewed by anyone who has the link until you revoke it.',
      ]],
      ['Plans and payment', [
        'The Free plan has daily limits. Paid plans are billed monthly in advance through Stripe and renew automatically until cancelled.',
        'You can cancel at any time from Manage billing. Cancellation takes effect at the end of the current billing period, and you keep access until then.',
        'If a payment fails, premium features may be paused until payment succeeds. We will give at least 30 days’ notice of any price change for existing subscriptions.',
        'Refunds are covered by our Refund Policy.',
      ]],
      ['Availability and changes', [
        'We work to keep LunarBid available and reliable, but it may occasionally be unavailable for maintenance or reasons outside our control. We may improve or change features; if we remove a feature that is central to a paid plan, we will tell you in advance.',
      ]],
      ['Ending your account', [
        'You can stop using LunarBid and ask us to delete your account at any time. We may suspend accounts that break these terms, and will explain why unless the law prevents it.',
      ]],
      ['Liability', [
        'LunarBid is provided as it is. To the extent permitted by law, we are not liable for indirect losses, lost profits or lost contracts, and our total liability is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under consumer law.',
      ]],
      ['Governing law and contact', [
        'These terms are governed by the laws of the Republic of Cameroon, without affecting mandatory consumer protections where you live. Questions: {email}.',
      ]],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what information LunarBid collects, why, who processes it, and the choices you have. LunarBid is operated by NWEE.',
    sections: [
      ['Information we collect', [
        'Account details: your name, email address and password (stored only as a secure hash), or your identifier and profile picture if you sign in with Google or GitHub.',
        'Profile details you choose to add: role, experience, skills, rate, portfolio link and bio.',
        'Content you create: job posts you paste, analyses, proposals, client profiles, branding (including uploaded logos) and support requests.',
        'Usage information: how many proposals and analyses you generate, for plan limits and your analytics.',
        'Billing: your plan and subscription status. Card details are collected and stored by Stripe, never by LunarBid.',
      ]],
      ['How we use it', [
        'To provide LunarBid: generating analyses and proposals, saving your history, enforcing plan limits, handling billing and answering support requests. We do not sell your information and do not use it for advertising.',
      ]],
      ['AI providers', [
        'To generate analyses and proposals, the job post you paste and relevant profile details are sent to an AI provider. We may use Groq, Together AI, OpenRouter, OpenAI or Anthropic, and automatically switch between them if one is unavailable. They process this content to return a result; under their API terms it is not used to train their models.',
      ]],
      ['Other service providers', [
        'Stripe (payments), our database and hosting providers, our email provider (account and support emails) and, if enabled, an error-monitoring service. Each processes information only to provide its service to us.',
      ]],
      ['Stored on your device', [
        'LunarBid keeps your sign-in session, language and theme in your browser’s local storage. We do not use advertising or tracking cookies.',
      ]],
      ['Retention and deletion', [
        'We keep your information while your account is open. Email {email} to access, correct, export or delete your data; we respond within 30 days. When you delete your account, your content is removed, except records we must keep by law (such as invoices).',
      ]],
      ['Security', [
        'Connections are encrypted, passwords are hashed, and each account can only access its own proposals. Shared proposal links use long random tokens and can be revoked at any time.',
      ]],
      ['Changes and contact', [
        'We will post changes here with a new date and notify you by email about significant changes. Questions: {email}.',
      ]],
    ],
  },
  refunds: {
    title: 'Refund Policy',
    intro: 'We want LunarBid to be worth what you pay. This policy explains when we refund payments.',
    sections: [
      ['Try before you pay', [
        'The Free plan lets you try LunarBid’s analysis and proposal writing before subscribing.',
      ]],
      ['Cancelling', [
        'You can cancel any time from Manage billing. You keep access until the end of the period you paid for, and you will not be charged again.',
      ]],
      ['When we refund', [
        'If you were charged in error, charged twice, or could not use LunarBid for a significant part of a billing period because of a problem on our side, contact us within 14 days of the charge and we will refund it.',
        'Otherwise, payments for a billing period that has started are not refunded, except where the law where you live requires it.',
      ]],
      ['How to ask', [
        'Email {email} from your account’s email address with the date of the charge. Approved refunds go back to the original payment method, usually within 5 to 10 business days.',
      ]],
    ],
  },
};

const fr = {
  terms: {
    title: 'Conditions d’utilisation',
    intro:
      'Ces conditions régissent votre utilisation de LunarBid, une plateforme de propositions commerciales propulsée par l’IA et exploitée par NWEE (« nous »). En créant un compte ou en utilisant LunarBid, vous les acceptez.',
    sections: [
      ['Votre compte', [
        'Vous devez fournir des informations exactes, protéger votre mot de passe et avoir au moins 16 ans. Vous êtes responsable de l’activité de votre compte.',
      ]],
      ['Utiliser LunarBid de façon responsable', [
        'LunarBid rédige des propositions à l’aide de l’intelligence artificielle. Les résultats de l’IA peuvent être inexacts ou incomplets. Vous êtes responsable de relire chaque proposition avant de l’envoyer, ainsi que de tout ce que vous envoyez à vos clients.',
        'N’utilisez pas LunarBid pour revendiquer une expérience, des qualifications ou des travaux que vous n’avez pas, pour envoyer du spam, pour enfreindre les règles des plateformes sur lesquelles vous postulez, ou pour traiter des contenus que vous n’avez pas le droit d’utiliser.',
        'Ne tentez pas de perturber le service, d’accéder à d’autres comptes, de contourner les limites d’utilisation ou d’extraire du contenu en masse par des moyens automatisés.',
      ]],
      ['Votre contenu', [
        'Vous êtes propriétaire des offres, profils et propositions que vous ajoutez ou créez. Vous nous autorisez à les stocker et à les traiter uniquement pour vous fournir le service, y compris en les transmettant à nos fournisseurs d’IA pour générer des résultats.',
        'Les propositions que vous partagez par lien peuvent être consultées par toute personne disposant du lien, jusqu’à ce que vous le révoquiez.',
      ]],
      ['Offres et paiement', [
        'L’offre gratuite comporte des limites quotidiennes. Les offres payantes sont facturées mensuellement à l’avance via Stripe et se renouvellent automatiquement jusqu’à leur résiliation.',
        'Vous pouvez résilier à tout moment depuis Gérer la facturation. La résiliation prend effet à la fin de la période de facturation en cours, et vous conservez l’accès jusque-là.',
        'En cas d’échec de paiement, les fonctionnalités premium peuvent être suspendues jusqu’à ce que le paiement aboutisse. Nous vous informerons au moins 30 jours à l’avance de tout changement de prix pour les abonnements existants.',
        'Les remboursements sont régis par notre Politique de remboursement.',
      ]],
      ['Disponibilité et évolutions', [
        'Nous faisons en sorte que LunarBid soit disponible et fiable, mais le service peut être ponctuellement indisponible pour maintenance ou pour des raisons indépendantes de notre volonté. Nous pouvons améliorer ou modifier des fonctionnalités ; si nous retirons une fonctionnalité essentielle d’une offre payante, nous vous en informerons à l’avance.',
      ]],
      ['Fin de votre compte', [
        'Vous pouvez cesser d’utiliser LunarBid et nous demander de supprimer votre compte à tout moment. Nous pouvons suspendre les comptes qui enfreignent ces conditions, et vous en expliquerons la raison sauf si la loi l’interdit.',
      ]],
      ['Responsabilité', [
        'LunarBid est fourni en l’état. Dans les limites permises par la loi, nous ne sommes pas responsables des pertes indirectes, des pertes de profits ou de contrats, et notre responsabilité totale est limitée au montant que vous nous avez versé au cours des 12 mois précédant la réclamation. Rien dans ces conditions ne limite les droits dont vous disposez en tant que consommateur.',
      ]],
      ['Droit applicable et contact', [
        'Ces conditions sont régies par le droit de la République du Cameroun, sans préjudice des protections impératives des consommateurs de votre pays de résidence. Questions : {email}.',
      ]],
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    intro:
      'Cette politique explique quelles informations LunarBid collecte, pourquoi, qui les traite et les choix dont vous disposez. LunarBid est exploité par NWEE.',
    sections: [
      ['Informations collectées', [
        'Données de compte : votre nom, votre adresse e-mail et votre mot de passe (conservé uniquement sous forme de hachage sécurisé), ou votre identifiant et votre photo de profil si vous vous connectez avec Google ou GitHub.',
        'Informations de profil que vous choisissez d’ajouter : métier, expérience, compétences, tarif, lien vers votre portfolio et biographie.',
        'Contenus que vous créez : offres collées, analyses, propositions, fiches clients, image de marque (y compris les logos importés) et demandes de support.',
        'Informations d’utilisation : le nombre de propositions et d’analyses générées, pour les limites de votre offre et vos statistiques.',
        'Facturation : votre offre et l’état de votre abonnement. Les données de carte sont collectées et conservées par Stripe, jamais par LunarBid.',
      ]],
      ['Utilisation', [
        'Pour fournir LunarBid : générer des analyses et des propositions, conserver votre historique, appliquer les limites de votre offre, gérer la facturation et répondre à vos demandes de support. Nous ne vendons pas vos informations et ne les utilisons pas à des fins publicitaires.',
      ]],
      ['Fournisseurs d’IA', [
        'Pour générer les analyses et les propositions, l’offre que vous collez et les informations pertinentes de votre profil sont transmises à un fournisseur d’IA. Nous pouvons utiliser Groq, Together AI, OpenRouter, OpenAI ou Anthropic, et basculer automatiquement de l’un à l’autre si l’un d’eux est indisponible. Ils traitent ce contenu pour renvoyer un résultat ; selon les conditions de leurs API, il n’est pas utilisé pour entraîner leurs modèles.',
      ]],
      ['Autres prestataires', [
        'Stripe (paiements), nos fournisseurs de base de données et d’hébergement, notre fournisseur d’e-mails (e-mails de compte et de support) et, s’il est activé, un service de suivi des erreurs. Chacun traite les informations uniquement pour nous fournir son service.',
      ]],
      ['Stockage sur votre appareil', [
        'LunarBid conserve votre session de connexion, votre langue et votre thème dans le stockage local de votre navigateur. Nous n’utilisons pas de cookies publicitaires ni de traçage.',
      ]],
      ['Conservation et suppression', [
        'Nous conservons vos informations tant que votre compte est ouvert. Écrivez à {email} pour consulter, corriger, exporter ou supprimer vos données ; nous répondons sous 30 jours. À la suppression de votre compte, vos contenus sont effacés, à l’exception des documents que la loi nous oblige à conserver (comme les factures).',
      ]],
      ['Sécurité', [
        'Les connexions sont chiffrées, les mots de passe sont hachés et chaque compte n’a accès qu’à ses propres propositions. Les liens de partage utilisent de longs jetons aléatoires et peuvent être révoqués à tout moment.',
      ]],
      ['Modifications et contact', [
        'Nous publierons les modifications sur cette page avec une nouvelle date et vous informerons par e-mail des changements importants. Questions : {email}.',
      ]],
    ],
  },
  refunds: {
    title: 'Politique de remboursement',
    intro: 'Nous voulons que LunarBid vaille ce que vous payez. Cette politique explique dans quels cas nous remboursons un paiement.',
    sections: [
      ['Essayer avant de payer', [
        'L’offre gratuite vous permet d’essayer l’analyse et la rédaction de propositions de LunarBid avant de vous abonner.',
      ]],
      ['Résiliation', [
        'Vous pouvez résilier à tout moment depuis Gérer la facturation. Vous conservez l’accès jusqu’à la fin de la période payée et ne serez plus débité.',
      ]],
      ['Quand nous remboursons', [
        'Si vous avez été débité par erreur, débité deux fois, ou si vous n’avez pas pu utiliser LunarBid pendant une part importante d’une période de facturation en raison d’un problème de notre côté, contactez-nous dans les 14 jours suivant le prélèvement et nous vous rembourserons.',
        'Sinon, les paiements d’une période de facturation déjà commencée ne sont pas remboursés, sauf lorsque la loi de votre pays l’exige.',
      ]],
      ['Comment en faire la demande', [
        'Écrivez à {email} depuis l’adresse e-mail de votre compte en indiquant la date du prélèvement. Les remboursements acceptés sont versés sur le moyen de paiement d’origine, généralement sous 5 à 10 jours ouvrés.',
      ]],
    ],
  },
};

export const LEGAL = { en, fr };
