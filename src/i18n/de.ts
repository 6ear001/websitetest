/**
 * German copy (default language).
 *
 * Edit texts here. Company data (address, phone, …) comes from src/config/site.ts.
 * Rule: no invented facts – no prices, years, sizes, certificates, customers,
 * testimonials, statistics, opening hours or service areas. Unknowns go into
 * src/config/site.ts as todo(…) and docs/TODO-before-launch.md.
 */
import { company } from '../config/site';
import { pathFor } from './config';
import type { Dictionary } from './types';

const tel = `<a href="tel:${company.phone.href}">${company.phone.display}</a>`;
const mail = `<a href="mailto:${company.email}">${company.email}</a>`;
const lang = 'de';

export const de: Dictionary = {
  lang,
  brandName: company.name,

  ui: {
    skipToContent: 'Zum Inhalt springen',
    mainNavLabel: 'Hauptnavigation',
    nav: { home: 'Startseite', services: 'Leistungen', about: 'Über uns', contact: 'Kontakt' },
    legal: { imprint: 'Impressum', privacy: 'Datenschutz' },
    ctaQuote: 'Angebot anfordern',
    menuOpen: 'Menü öffnen',
    menuClose: 'Menü schließen',
    languageLabel: 'Sprache wählen',
    homeLinkLabel: `${company.name} – zur Startseite`,
    phone: 'Telefon',
    email: 'E-Mail',
    address: 'Adresse',
    openMap: 'Anfahrt in OpenStreetMap öffnen',
    externalHint: '(externe Website)',
    todoLabel: 'TODO',
    footer: {
      tagline: 'Lagerung und Versand aus einer Hand – in Reichelsheim im Odenwald.',
      servicesHeading: 'Leistungen',
      companyHeading: 'Unternehmen',
      legalHeading: 'Rechtliches',
      contactHeading: 'Kontakt',
      groupLine: 'Ein Unternehmen der D-Group',
      groupLinkLabel: 'zur Website von D-Group IT Solutions',
      copyright: `© {year} ${company.name}`,
    },
  },

  meta: {
    home: {
      title: 'D-Group Storage & Shipping | Lagerung & Versand in Reichelsheim',
      description:
        'Lagerung und Versand aus einer Hand: D-Group Storage & Shipping in Reichelsheim (Odenwald). Beschreiben Sie Ihren Bedarf – wir erstellen Ihnen ein Angebot.',
    },
    services: {
      title: 'Leistungen: Lagerung & Versand | D-Group Storage & Shipping',
      description:
        'Lagerung und Versand nach Ihrem Bedarf: Wir nehmen Ihre Ware an, lagern sie ein und bringen Ihre Sendungen auf den Weg. Jetzt unverbindlich anfragen.',
    },
    about: {
      title: 'Über uns | D-Group Storage & Shipping',
      description:
        'D-Group Storage & Shipping ist ein neues Unternehmen der D-Group mit Sitz in Reichelsheim (Odenwald). Inhaber: Baschir Qassab. Lernen Sie uns kennen.',
    },
    contact: {
      title: 'Kontakt & Angebot anfordern | D-Group Storage & Shipping',
      description:
        'Fordern Sie ein unverbindliches Angebot für Lagerung und Versand an – per Formular, E-Mail oder Telefon. D-Group Storage & Shipping, Reichelsheim.',
    },
    imprint: {
      title: 'Impressum | D-Group Storage & Shipping',
      description:
        'Impressum und Anbieterkennzeichnung von D-Group Storage & Shipping, Inhaber Baschir Qassab, Darmstädterstraße 3, 64385 Reichelsheim.',
    },
    privacy: {
      title: 'Datenschutzerklärung | D-Group Storage & Shipping',
      description:
        'So geht D-Group Storage & Shipping mit Ihren Daten um: keine Cookies, kein Tracking und keine Inhalte von Drittanbietern auf dieser Website.',
    },
  },

  home: {
    hero: {
      eyebrow: 'Lagerung & Versand · Reichelsheim (Odenwald)',
      title: 'Lagerung und Versand – aus einer Hand.',
      highlight: 'aus einer Hand.',
      lead: 'D-Group Storage & Shipping ist Ihr neuer Partner für Lagerung und Versand. Sie sagen uns, was Sie einlagern oder verschicken möchten – wir erstellen Ihnen ein Angebot, das zu Ihrem Bedarf passt.',
      primary: 'Angebot anfordern',
      secondary: 'Leistungen ansehen',
      note: 'Ihre Anfrage ist unverbindlich.',
    },
    services: {
      eyebrow: 'Leistungen',
      title: 'Zwei Leistungen, ein Ansprechpartner',
      intro:
        'Ob Sie Ware zwischenlagern, länger unterbringen oder regelmäßig verschicken möchten: Wir besprechen Ihren Bedarf und finden mit Ihnen eine passende Lösung.',
      storage: {
        title: 'Lagerung',
        text: 'Wir nehmen Ihre Ware an, lagern sie geordnet ein und halten sie für Sie bereit – kurzfristig oder für längere Zeit, ganz nach Absprache.',
        link: 'Mehr zur Lagerung',
      },
      shipping: {
        title: 'Versand',
        text: 'Wir bereiten Ihre Sendungen vor und bringen sie direkt aus dem Lager auf den Weg – ohne dass Sie sich um die Details kümmern müssen.',
        link: 'Mehr zum Versand',
      },
    },
    process: {
      eyebrow: 'So funktioniert’s',
      title: 'In vier Schritten zu Ihrer Lösung',
      intro: 'Von der ersten Nachricht bis zur fertigen Sendung – so arbeiten wir zusammen.',
      steps: [
        {
          title: 'Anfrage',
          text: 'Sie beschreiben uns kurz, was Sie einlagern oder versenden möchten – per Formular, E-Mail oder Telefon.',
        },
        {
          title: 'Angebot',
          text: 'Wir prüfen Ihre Anfrage, klären offene Fragen mit Ihnen und erstellen Ihnen ein individuelles Angebot.',
        },
        {
          title: 'Einlagerung',
          text: 'Nach Ihrer Zusage nehmen wir Ihre Ware in Empfang und lagern sie so ein, wie wir es vereinbart haben.',
        },
        {
          title: 'Versand',
          text: 'Auf Ihren Auftrag hin bereiten wir die Sendung vor und bringen sie auf den Weg.',
        },
      ],
    },
    why: {
      eyebrow: 'Warum D-Group',
      title: 'Klar. Persönlich. Aus einer Hand.',
      intro:
        'Wir sind ein junges Unternehmen. Statt großer Versprechen bieten wir Ihnen klare Absprachen und einen direkten Draht.',
      // TODO: confirm – every statement must stay true for the company (also in ar.ts)
      items: [
        {
          title: 'Alles aus einer Hand',
          text: 'Lagerung und Versand bei einem Partner: weniger Abstimmung, weniger Schnittstellen, ein Ansprechpartner.',
        },
        {
          title: 'Persönlich erreichbar',
          text: 'Sie sprechen direkt mit den Menschen, die sich um Ihren Auftrag kümmern.',
        },
        {
          title: 'Angebot nach Maß',
          text: 'Kein Paket von der Stange: Ihr Angebot richtet sich nach Ihrer Ware, Ihrer Menge und Ihrem Zeitplan.',
        },
        {
          title: 'Teil der D-Group',
          text: 'Wir gehören zur D-Group – gemeinsam mit unserem Schwesterunternehmen D-Group IT Solutions.',
        },
      ],
    },
    cta: {
      title: 'Ware einlagern oder verschicken?',
      text: 'Erzählen Sie uns, worum es geht. Wir melden uns mit einem passenden Angebot bei Ihnen.',
      button: 'Angebot anfordern',
    },
  },

  services: {
    hero: {
      eyebrow: 'Leistungen',
      title: 'Lagerung und Versand',
      highlight: 'Versand',
      lead: 'Zwei Leistungen, die ineinandergreifen: Wir lagern Ihre Ware ein und versenden sie, wenn Sie es brauchen. Was genau wir für Sie übernehmen, stimmen wir individuell mit Ihnen ab.',
    },
    jumpLabel: 'Direkt zu:',
    storage: {
      title: 'Lagerung',
      lead: 'Sie brauchen Platz für Ihre Ware – vorübergehend oder dauerhaft? Wir lagern sie für Sie ein und halten sie bereit, bis Sie sie benötigen.',
      listTitle: 'Was wir für Sie übernehmen',
      // TODO: confirm service scope – draft list, keep only what is actually offered (also in ar.ts)
      list: [
        'Annahme Ihrer Anlieferung',
        'Geordnete Einlagerung nach Absprache',
        'Kurz- oder längerfristige Lagerung',
        'Herausgabe oder Versand auf Abruf',
      ],
      note: 'Welche Waren wir in welchen Mengen aufnehmen können, klären wir im persönlichen Gespräch. Schreiben Sie uns einfach, worum es geht.',
    },
    shipping: {
      title: 'Versand',
      lead: 'Ihre Ware soll zum Kunden, zum Händler oder an einen anderen Standort? Wir bereiten Ihre Sendungen vor und bringen sie auf den Weg.',
      listTitle: 'Was wir für Sie übernehmen',
      // TODO: confirm service scope – esp. "Verpackung" (also in ar.ts)
      list: [
        'Versand direkt aus unserem Lager',
        'Vorbereitung und Verpackung Ihrer Sendungen',
        'Einzelsendungen oder regelmäßiger Versand',
        'Abstimmung von Terminen und Versandart mit Ihnen',
      ],
      note: 'Zielorte, Versandarten und Laufzeiten besprechen wir individuell mit Ihnen.',
    },
    combined: {
      title: 'Lagerung und Versand kombinieren',
      text: 'Ihre Ware liegt bei uns und wird direkt von hier verschickt. Sie entscheiden, was wann rausgeht – wir kümmern uns um die Abwicklung.',
    },
    faq: {
      title: 'Häufige Fragen',
      items: [
        {
          question: 'Was kostet die Lagerung oder der Versand?',
          answer:
            'Das hängt davon ab, was, wie viel und wie lange Sie einlagern oder versenden möchten. Deshalb nennen wir keine Pauschalpreise, sondern erstellen Ihnen ein individuelles Angebot.',
        },
        {
          question: 'Welche Waren nehmen Sie an?',
          answer:
            'Das klären wir im Einzelfall. Beschreiben Sie in Ihrer Anfrage kurz Art, Menge und Maße Ihrer Ware – dann sagen wir Ihnen, ob und wie wir sie unterbringen können.',
        },
        {
          question: 'Wohin versenden Sie?',
          answer:
            'Zielorte, Versandarten und Termine stimmen wir mit Ihnen ab. Nennen Sie uns in Ihrer Anfrage einfach, wohin Ihre Sendungen gehen sollen.',
        },
        {
          question: 'Kann ich Lagerung und Versand kombinieren?',
          answer:
            'Ja, genau dafür sind wir da: Ihre Ware liegt bei uns und wird auf Ihren Auftrag direkt von hier verschickt.',
        },
        {
          question: 'Wie läuft eine Anfrage ab?',
          answer: `Sie schicken uns Ihre Anfrage über das <a href="${pathFor('contact', lang)}#anfrage">Anfrageformular</a>, per E-Mail oder telefonisch. Wir melden uns, klären offene Punkte und schicken Ihnen ein Angebot.`,
        },
      ],
    },
    cta: {
      title: 'Passt das zu Ihrem Bedarf?',
      text: 'Beschreiben Sie uns Ihre Ware und Ihr Vorhaben – wir erstellen Ihnen ein unverbindliches Angebot.',
      button: 'Angebot anfordern',
    },
  },

  about: {
    hero: {
      eyebrow: 'Über uns',
      title: 'Ein neues Unternehmen der D-Group',
      highlight: 'D-Group',
      lead: 'D-Group Storage & Shipping bringt Lagerung und Versand zusammen – mit kurzen Wegen, klaren Absprachen und einem Ansprechpartner, der Ihren Auftrag kennt.',
    },
    group: {
      eyebrow: 'Die D-Group',
      title: 'Teil der D-Group-Familie',
      paragraphs: [
        'D-Group Storage & Shipping gehört zur D-Group. Zur selben Unternehmensfamilie gehört auch <strong>D-Group IT Solutions</strong>, unser Schwesterunternehmen für IT-Lösungen.',
        'Mit D-Group Storage & Shipping kommt ein neuer Bereich hinzu: Lagerung und Versand.',
      ],
      sisterTag: 'Schwesterunternehmen',
      sisterText: 'IT-Lösungen',
      sisterLink: 'Website besuchen',
      selfTag: 'Neu',
      selfText: 'Lagerung & Versand',
      selfBadge: 'Sie sind hier',
    },
    owner: {
      eyebrow: 'Inhaber',
      title: company.owner,
      role: `Inhaber von ${company.name}`,
      // TODO: confirm wording with the owner (also in ar.ts)
      paragraphs: [
        `Hinter ${company.name} steht Inhaber ${company.owner} – Ihr Ansprechpartner für Anfrage, Angebot und Abwicklung.`,
        'Sie haben Fragen zu Ihrem Vorhaben? Rufen Sie an oder schreiben Sie uns – Sie bekommen eine Antwort von dem Menschen, der Ihren Auftrag betreut.',
      ],
      monogram: 'BQ',
    },
    values: {
      eyebrow: 'Unsere Haltung',
      title: 'Worauf Sie sich verlassen können',
      items: [
        { title: 'Offenheit', text: 'Wir sagen Ihnen ehrlich, was wir leisten können – und was nicht.' },
        {
          title: 'Klare Absprachen',
          text: 'Leistungen und Konditionen halten wir vor dem Start schriftlich im Angebot fest.',
        },
        { title: 'Sorgfalt', text: 'Wir gehen mit Ihrer Ware so um, als wäre es unsere eigene.' },
      ],
    },
    location: {
      eyebrow: 'Standort',
      title: 'Reichelsheim im Odenwald',
      text: 'Unser Firmensitz liegt in Reichelsheim im hessischen Odenwald.',
    },
    cta: {
      title: 'Lernen wir uns kennen',
      text: 'Erzählen Sie uns von Ihrem Vorhaben – wir freuen uns auf Ihre Nachricht.',
      button: 'Angebot anfordern',
    },
  },

  contact: {
    hero: {
      eyebrow: 'Kontakt',
      title: 'Angebot anfordern',
      highlight: 'anfordern',
      lead: 'Beschreiben Sie kurz, was Sie einlagern oder versenden möchten. Je mehr wir wissen, desto genauer wird unser Angebot.',
    },
    formTitle: 'Ihre Anfrage',
    formIntro: 'Füllen Sie aus, was für Ihr Anliegen wichtig ist. Pflichtfelder sind mit * gekennzeichnet.',
    fields: {
      name: 'Name',
      company: 'Firma',
      email: 'E-Mail',
      phone: 'Telefon',
      topic: 'Worum geht es?',
      topicOptions: [
        { value: 'lagerung', label: 'Lagerung' },
        { value: 'versand', label: 'Versand' },
        { value: 'lagerung-versand', label: 'Lagerung und Versand' },
        { value: 'sonstiges', label: 'Etwas anderes' },
      ],
      goods: 'Art der Ware',
      goodsHint: 'z. B. Kartons, Paletten, Möbel, Maschinenteile',
      quantity: 'Menge / Umfang',
      quantityHint: 'z. B. 30 Kartons oder 4 Paletten',
      timeframe: 'Zeitraum',
      timeframeHint: 'z. B. ab Mai für etwa sechs Monate',
      message: 'Ihre Nachricht',
      messageHint: 'Was sollten wir sonst noch wissen?',
      consent: `Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage verwendet werden. Weitere Informationen finden Sie in der <a href="${pathFor('privacy', lang)}">Datenschutzerklärung</a>.`,
      honeypot: 'Bitte dieses Feld leer lassen',
    },
    optional: '(optional)',
    requiredNote: '* Pflichtfeld',
    submit: 'Anfrage senden',
    sending: 'Wird gesendet …',
    mailtoNote:
      'Hinweis: Beim Absenden öffnet sich Ihr E-Mail-Programm mit einer vorbereiteten Nachricht. Ihre Anfrage wird erst verschickt, wenn Sie die E-Mail dort absenden.',
    endpointNote: 'Ihre Angaben werden nach dem Absenden an uns übermittelt.',
    errors: {
      summary: 'Bitte prüfen Sie die markierten Felder.',
      required: 'Bitte füllen Sie dieses Feld aus.',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      consent: 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.',
      topic: 'Bitte wählen Sie aus, worum es geht.',
    },
    success: 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns so bald wie möglich bei Ihnen.',
    successMailto: `Ihr E-Mail-Programm sollte sich jetzt geöffnet haben – bitte senden Sie die vorbereitete E-Mail dort ab. Falls sich nichts geöffnet hat, schreiben Sie uns direkt an ${mail}.`,
    failure: `Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an ${mail}.`,
    mailSubject: 'Angebotsanfrage über die Website',
    directTitle: 'Direkter Kontakt',
    directText: 'Sie möchten lieber anrufen oder eine E-Mail schreiben? Gerne.',
    nextTitle: 'So geht es weiter',
    nextSteps: [
      'Wir sehen uns Ihre Anfrage an.',
      'Bei offenen Fragen melden wir uns bei Ihnen.',
      'Sie erhalten ein Angebot, das auf Ihren Bedarf zugeschnitten ist.',
    ],
  },

  imprint: {
    title: 'Impressum',
    lawRef: 'Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)',
    ownerLabel: 'Inhaber',
    contactHeading: 'Kontakt',
    taxHeading: 'Steuerliche Angaben',
    vatLabel: 'Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz',
    taxNumberLabel: 'Steuernummer',
    registerHeading: 'Registereintrag',
    disputeHeading: 'Verbraucherstreitbeilegung',
    disputeText:
      'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
  },

  privacy: {
    title: 'Datenschutzerklärung',
    lawyerNote:
      'Entwurf auf Basis einer Standardvorlage für eine statische Website – vor der Veröffentlichung anwaltlich prüfen lassen.',
    updatedLabel: 'Stand',
    sections: [
      {
        heading: '1. Verantwortlicher',
        paragraphs: [
          'Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:',
          `${company.name}<br>Inhaber: ${company.owner}<br>${company.address.street}<br>${company.address.postalCode} ${company.address.city}<br>${company.address.country}`,
          `Telefon: ${tel}<br>E-Mail: ${mail}`,
        ],
      },
      {
        heading: '2. Das Wichtigste in Kürze',
        paragraphs: [
          'Wir verarbeiten personenbezogene Daten nur, soweit das für den Betrieb dieser Website und die Bearbeitung Ihrer Anfragen erforderlich ist.',
        ],
        list: [
          'Diese Website setzt keine Cookies.',
          'Wir verwenden keine Analyse- oder Tracking-Werkzeuge.',
          'Schriftarten, Grafiken und Skripte werden ausschließlich von unserem eigenen Server geladen – es werden keine Inhalte von Drittanbietern eingebunden.',
          'Wir geben Ihre Daten nicht zu Werbezwecken weiter.',
          'Wir setzen keine automatisierte Entscheidungsfindung oder Profiling (Art. 22 DSGVO) ein.',
        ],
      },
      {
        heading: '3. Hosting und Server-Logfiles',
        paragraphs: [
          'Diese Website wird bei einem externen Dienstleister (Hoster) betrieben. Bei jedem Seitenaufruf erfasst der Server automatisch Informationen, die Ihr Browser übermittelt (Server-Logfiles):',
        ],
        list: [
          'IP-Adresse des anfragenden Geräts',
          'Datum und Uhrzeit des Zugriffs',
          'aufgerufene Seite bzw. Datei, übertragene Datenmenge und Statuscode',
          'Referrer-URL (die zuvor besuchte Seite)',
          'verwendeter Browser und Betriebssystem',
        ],
        after: [
          'Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der technisch fehlerfreien, sicheren und stabilen Bereitstellung der Website. Die Logfiles werden gelöscht, sobald sie für diesen Zweck nicht mehr erforderlich sind.',
        ],
        todo: 'Hoster (Name, Anschrift) und Speicherdauer der Logfiles ergänzen; Auftragsverarbeitungsvertrag nach Art. 28 DSGVO abschließen.',
      },
      {
        heading: '4. Verschlüsselung',
        paragraphs: [
          'Diese Website wird über eine verschlüsselte Verbindung (HTTPS/TLS) übertragen. Sie erkennen das an „https://“ in der Adresszeile Ihres Browsers.',
        ],
        todo: 'Sicherstellen, dass der Hoster HTTPS mit gültigem Zertifikat bereitstellt.',
      },
      {
        heading: '5. Kontakt per E-Mail oder Telefon',
        paragraphs: [
          'Wenn Sie uns per E-Mail oder Telefon kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, Kontaktdaten und Inhalt Ihrer Anfrage), um Ihr Anliegen zu bearbeiten.',
          'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage auf einen Vertrag oder vorvertragliche Maßnahmen gerichtet ist, im Übrigen Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).',
          'Wir löschen Ihre Daten, sobald Ihre Anfrage abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten (z. B. nach Handels- oder Steuerrecht) entgegenstehen.',
        ],
      },
      {
        heading: '6. Anfrageformular',
        paragraphs: [
          'Über das Anfrageformular können Sie uns Ihr Anliegen schildern. Pflichtangaben sind Name, E-Mail-Adresse, die gewünschte Leistung und Ihre Nachricht; alle weiteren Angaben sind freiwillig.',
          'Das Formular überträgt keine Daten an unseren Webserver. Beim Absenden öffnet sich stattdessen Ihr E-Mail-Programm mit einer vorbereiteten Nachricht an uns. Die Daten erreichen uns erst, wenn Sie diese E-Mail selbst abschicken. Für die weitere Verarbeitung gilt Abschnitt 5.',
          'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, die Sie mit dem Ankreuzen der Einwilligungs-Checkbox erteilen. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, z. B. per E-Mail an uns.',
        ],
        todo: 'Falls künftig ein Formular-Endpunkt bzw. Formulardienst genutzt wird: Absatz 2 ersetzen und Anbieter, Zweck, Auftragsverarbeitung und ggf. Drittlandübermittlung beschreiben.',
      },
      {
        heading: '7. Cookies und lokale Speicherung',
        paragraphs: [
          'Diese Website setzt keine Cookies und legt keine Daten im Speicher Ihres Browsers ab (z. B. Local Storage). Ein Cookie-Banner ist deshalb nicht erforderlich.',
        ],
      },
      {
        heading: '8. Schriftarten',
        paragraphs: [
          'Die verwendeten Schriftarten (Montserrat und Noto Kufi Arabic) sind auf unserem eigenen Server gespeichert. Beim Aufruf der Website wird keine Verbindung zu Servern von Google oder anderen Anbietern hergestellt.',
        ],
      },
      {
        heading: '9. Links zu anderen Websites',
        paragraphs: [
          'Diese Website enthält Links zu externen Websites, z. B. zu D-Group IT Solutions oder zu OpenStreetMap für die Anfahrt. Daten werden erst übertragen, wenn Sie einen solchen Link anklicken. Für die verlinkten Websites ist der jeweilige Anbieter verantwortlich.',
        ],
      },
      {
        heading: '10. Ihre Rechte',
        paragraphs: ['Sie haben im Rahmen der gesetzlichen Vorgaben jederzeit das Recht auf:'],
        list: [
          'Auskunft über Ihre bei uns gespeicherten Daten (Art. 15 DSGVO)',
          'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
          'Löschung Ihrer Daten (Art. 17 DSGVO)',
          'Einschränkung der Verarbeitung (Art. 18 DSGVO)',
          'Datenübertragbarkeit (Art. 20 DSGVO)',
          'Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)',
          'Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)',
        ],
        after: ['Wenden Sie sich dazu einfach an die in Abschnitt 1 genannten Kontaktdaten.'],
      },
      {
        heading: '11. Beschwerderecht bei der Aufsichtsbehörde',
        paragraphs: [
          'Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für uns zuständig ist:',
          'Der Hessische Beauftragte für Datenschutz und Informationsfreiheit<br>Gustav-Stresemann-Ring 1<br>65189 Wiesbaden<br><a href="https://datenschutz.hessen.de">datenschutz.hessen.de</a>',
        ],
      },
      {
        heading: '12. Änderungen dieser Datenschutzerklärung',
        paragraphs: [
          'Wir passen diese Datenschutzerklärung an, wenn sich unsere Website oder die rechtlichen Vorgaben ändern. Es gilt die jeweils hier veröffentlichte Fassung.',
        ],
      },
    ],
  },

  notFound: {
    meta: {
      title: 'Seite nicht gefunden (404) | D-Group Storage & Shipping',
      description: 'Die aufgerufene Seite wurde nicht gefunden.',
    },
    title: 'Seite nicht gefunden',
    text: 'Die aufgerufene Seite gibt es nicht (mehr). Vielleicht hilft Ihnen einer dieser Links weiter:',
    home: 'Zur Startseite',
    contact: 'Kontakt aufnehmen',
  },
};
