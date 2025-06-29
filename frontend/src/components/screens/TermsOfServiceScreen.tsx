import React from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';

export const TermsOfServiceScreen: React.FC<ScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Terms of Service" onBack={onBack} />
      
      <div className="max-w-4xl mx-auto prose prose-invert prose-sm">
        <div className="space-y-6 text-sm leading-relaxed">
          
          <div className="text-center mb-8">
            <p className="text-gray-400">Last updated: June 20, 2025</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing or using VonVault ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-gray-300 mb-3">VonVault is a decentralized finance (DeFi) investment platform offering:</p>
            <ul className="text-gray-300 space-y-1 ml-4">
              <li>• <strong>Tiered Membership System</strong>: Club, Premium, VIP, and Elite levels</li>
              <li>• <strong>Investment Opportunities</strong>: Various DeFi investment plans with different returns</li>
              <li>• <strong>Portfolio Management</strong>: Real-time tracking of investments and returns</li>
              <li>• <strong>Multi-Asset Support</strong>: Bank account and cryptocurrency wallet integration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Investment Risks</h2>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-400 mb-2">⚠️ Important Risk Disclosure</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <strong>No Guaranteed Returns</strong>: All investments involve risk of loss</li>
                <li>• <strong>Market Volatility</strong>: Cryptocurrency and DeFi markets are highly volatile</li>
                <li>• <strong>Regulatory Risk</strong>: Changes in regulations may affect investments</li>
                <li>• <strong>Technology Risk</strong>: Smart contracts and blockchain technology carry inherent risks</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Membership Tiers</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-500/30">
                <h3 className="text-lg font-medium text-amber-400 mb-2">🥉 Club Tier</h3>
                <p className="text-gray-300 text-sm">$0 - $50,000 total invested</p>
                <p className="text-white font-semibold">6% APY</p>
                <p className="text-gray-400 text-sm">$100 - $20,000 per investment</p>
              </div>
              
              <div className="bg-gray-600/30 rounded-lg p-4 border border-gray-400/30">
                <h3 className="text-lg font-medium text-gray-300 mb-2">🥈 Premium Tier</h3>
                <p className="text-gray-300 text-sm">$50,001 - $150,000 total invested</p>
                <p className="text-white font-semibold">8-10% APY</p>
                <p className="text-gray-400 text-sm">$500 - $50,000 per investment</p>
              </div>
              
              <div className="bg-yellow-600/30 rounded-lg p-4 border border-yellow-400/30">
                <h3 className="text-lg font-medium text-yellow-400 mb-2">🥇 VIP Tier</h3>
                <p className="text-gray-300 text-sm">$150,001 - $500,000 total invested</p>
                <p className="text-white font-semibold">12-14% APY</p>
                <p className="text-gray-400 text-sm">$1,000 - $100,000 per investment</p>
              </div>
              
              <div className="bg-purple-600/30 rounded-lg p-4 border border-purple-400/30">
                <h3 className="text-lg font-medium text-purple-400 mb-2">💎 Elite Tier</h3>
                <p className="text-gray-300 text-sm">$500,001+ total invested</p>
                <p className="text-white font-semibold">16-20% APY</p>
                <p className="text-gray-400 text-sm">$5,000 - $250,000+ per investment</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Financial Connections</h2>
            <div className="space-y-4">
              <div className="bg-blue-900/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-400 mb-2">🏦 Bank Account Integration</h3>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Third-party service (Teller API) used for bank connectivity</li>
                  <li>• We do not store your banking credentials</li>
                  <li>• You authorize read-only access to account balances</li>
                </ul>
              </div>
              
              <div className="bg-orange-900/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-orange-400 mb-2">🔗 Cryptocurrency Wallets</h3>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Connect compatible wallets (MetaMask, WalletConnect)</li>
                  <li>• You maintain full control of your crypto assets</li>
                  <li>• We do not have access to your private keys</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. User Responsibilities</h2>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <ul className="text-gray-300 space-y-2">
                <li>• <strong>Compliance</strong>: Follow all applicable laws and regulations</li>
                <li>• <strong>Security</strong>: Maintain strong passwords and secure devices</li>
                <li>• <strong>Accuracy</strong>: Provide accurate information for all transactions</li>
                <li>• <strong>Tax Compliance</strong>: Ensure proper tax reporting in your jurisdiction</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Disclaimers</h2>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-400 mb-2">⚠️ Important Disclaimers</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• <strong>Not Financial Advice</strong>: Information provided is educational only</li>
                <li>• <strong>Risk of Loss</strong>: You may lose some or all invested funds</li>
                <li>• <strong>No FDIC Insurance</strong>: Investments are not insured by government agencies</li>
                <li>• <strong>Service "As Is"</strong>: No warranties regarding performance or availability</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Information</h2>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-300 mb-2">For questions about these Terms:</p>
              <ul className="text-gray-300 space-y-1">
                <li><strong>Email</strong>: legal@vonartis.app</li>
                <li><strong>Customer Support</strong>: support@vonartis.app</li>
              </ul>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              By using VonVault, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p className="text-center text-gray-400 text-sm mt-2">
              Last updated: June 20, 2025
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};