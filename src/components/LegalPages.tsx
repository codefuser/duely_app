import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

type PageType = 'privacy' | 'terms' | 'about' | 'help' | 'contact';

interface Props {
  page: PageType;
  onBack: () => void;
}

const content: Record<PageType, { title: string; body: React.ReactNode }> = {
  privacy: {
    title: 'Privacy Policy',
    body: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p className="text-foreground font-medium">Last updated: March 2026</p>
        <h3 className="text-foreground font-semibold text-base">Data Storage</h3>
        <p>Duely stores all your data locally on your device. We do not collect, transmit, or store any personal information on external servers. Your financial records, shop names, and transaction history remain entirely on your phone.</p>
        <h3 className="text-foreground font-semibold text-base">Information We Don't Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personal identification information</li>
          <li>Financial or banking details</li>
          <li>Location data</li>
          <li>Usage analytics or tracking data</li>
          <li>Contact information</li>
        </ul>
        <h3 className="text-foreground font-semibold text-base">Voice Input</h3>
        <p>When you use voice input, audio is processed by your device's built-in speech recognition. No audio data is sent to our servers.</p>
        <h3 className="text-foreground font-semibold text-base">Data Export</h3>
        <p>You can export your data as a JSON file at any time. This file is saved directly to your device and is not uploaded anywhere.</p>
        <h3 className="text-foreground font-semibold text-base">Changes</h3>
        <p>We may update this privacy policy from time to time. Any changes will be reflected within the app.</p>
      </div>
    ),
  },
  terms: {
    title: 'Terms & Conditions',
    body: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p className="text-foreground font-medium">Last updated: March 2026</p>
        <h3 className="text-foreground font-semibold text-base">Acceptance</h3>
        <p>By using Duely, you agree to these terms. If you do not agree, please do not use the app.</p>
        <h3 className="text-foreground font-semibold text-base">Use of the App</h3>
        <p>Duely is a personal finance tracking tool designed to help you remember credit purchases. It is not a financial advisor, bank, or lending service.</p>
        <h3 className="text-foreground font-semibold text-base">Data Responsibility</h3>
        <p>Since all data is stored locally, you are responsible for backing up your data. We are not liable for data loss due to device issues, app uninstallation, or cache clearing.</p>
        <h3 className="text-foreground font-semibold text-base">Accuracy</h3>
        <p>While we strive for accuracy, you should verify all calculations independently. Duely is a tracking aid, not an accounting system.</p>
        <h3 className="text-foreground font-semibold text-base">Limitation of Liability</h3>
        <p>Duely is provided "as is" without warranties. We are not responsible for any financial decisions made based on the app's data.</p>
      </div>
    ),
  },
  about: {
    title: 'About Duely',
    body: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <div className="text-center py-4">
          <p className="text-5xl mb-3">📒</p>
          <h3 className="text-foreground font-bold text-xl">Duely</h3>
          <p className="text-xs mt-1">Version 2.0</p>
        </div>
        <p>Duely is your personal debt memory assistant. Designed for students, daily wage workers, and anyone who buys on credit from local shops.</p>
        <h3 className="text-foreground font-semibold text-base">Features</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Track what you owe and what others owe you</li>
          <li>Organize by Shops, Persons, or custom categories</li>
          <li>Voice input in English and Tamil</li>
          <li>Smart reminders for overdue payments</li>
          <li>Beautiful charts and analytics</li>
          <li>Multiple themes and dark mode</li>
          <li>Export and import data</li>
          <li>Works offline as a PWA</li>
        </ul>
        <h3 className="text-foreground font-semibold text-base">Mission</h3>
        <p>To ensure no one forgets a small debt, creating trust and transparency in everyday financial interactions.</p>
      </div>
    ),
  },
  help: {
    title: 'Help & Support',
    body: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 className="text-foreground font-semibold text-base">Getting Started</h3>
        <p>1. Add a shop or person using the + button on the home screen.</p>
        <p>2. Tap on a shop/person to view their details.</p>
        <p>3. Use "I Owe Them" or "They Owe Me" tabs to track debts in both directions.</p>
        <p>4. Add credits (items bought) and payments (amounts paid).</p>
        <h3 className="text-foreground font-semibold text-base">Voice Input</h3>
        <p>Tap the microphone icon and say something like "Tea 20 rupees" or "சாய் இருபது" to quickly add entries.</p>
        <h3 className="text-foreground font-semibold text-base">Managing Tabs</h3>
        <p>Go to Settings → Manage Tabs to create, edit, reorder, or delete custom categories.</p>
        <h3 className="text-foreground font-semibold text-base">Data Safety</h3>
        <p>Regularly export your data from Settings → Export Data. Keep the backup file safe for restoration.</p>
        <h3 className="text-foreground font-semibold text-base">Common Issues</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Data disappeared:</strong> Check if you cleared browser data. Restore from a backup.</li>
          <li><strong>Voice not working:</strong> Ensure microphone permissions are granted.</li>
          <li><strong>App not installing:</strong> Use Chrome/Safari and look for the install prompt.</li>
        </ul>
      </div>
    ),
  },
  contact: {
    title: 'Contact Us',
    body: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <div className="text-center py-4">
          <p className="text-4xl mb-3">💬</p>
          <h3 className="text-foreground font-bold text-lg">We'd love to hear from you!</h3>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
          <div>
            <p className="text-foreground font-medium text-xs uppercase tracking-wider">Email</p>
            <p className="text-primary font-medium">support@duely.app</p>
          </div>
          <div>
            <p className="text-foreground font-medium text-xs uppercase tracking-wider">Feedback</p>
            <p>We're always improving! Send us your suggestions, bug reports, or feature requests.</p>
          </div>
          <div>
            <p className="text-foreground font-medium text-xs uppercase tracking-wider">Social</p>
            <p>Follow us for updates and tips on managing your daily finances.</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground pt-2">We typically respond within 24-48 hours.</p>
      </div>
    ),
  },
};

const LegalPages = ({ page, onBack }: Props) => {
  const { title, body } = content[page];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border safe-top">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="flex-1 overflow-auto p-5">{body}</div>
    </motion.div>
  );
};

export default LegalPages;
