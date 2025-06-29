import React from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';

export const PrivacyPolicyScreen: React.FC<ScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Privacy Policy" onBack={onBack} />
      
      <div className="max-w-4xl mx-auto prose prose-invert prose-sm">
        <div className="space-y-6 text-sm leading-relaxed">
          
          <div className="text-center mb-8">
            <p className="text-gray-400">Last updated: June 20, 2025</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="text-gray-300">
              Welcome to VonVault ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our DeFi investment platform and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-purple-400 mb-2">Personal Information</h3>
            <ul className="text-gray-300 space-y-1 ml-4">
              <li>• <strong>Account Information</strong>: Name, email address, phone number</li>
              <li>• <strong>Identity Verification</strong>: Government-issued ID, address verification</li>
              <li>• <strong>Financial Information</strong>: Bank account details, crypto wallet addresses</li>
              <li>• <strong>Investment Data</strong>: Portfolio holdings, transaction history, membership tier</li>
            </ul>

            <h3 className="text-lg font-medium text-purple-400 mb-2 mt-4">Automatically Collected Information</h3>
            <ul className="text-gray-300 space-y-1 ml-4">
              <li>• <strong>Usage Data</strong>: App interactions, feature usage, session duration</li>
              <li>• <strong>Device Information</strong>: Device type, operating system, browser type</li>
              <li>• <strong>Location Data</strong>: IP address, general geographic location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li>• <strong>Account Management</strong>: Create and maintain your VonVault account</li>
              <li>• <strong>Investment Services</strong>: Process investments, calculate returns, manage portfolios</li>
              <li>• <strong>Membership System</strong>: Determine tier status, available investment plans</li>
              <li>• <strong>Customer Support</strong>: Respond to inquiries and provide assistance</li>
              <li>• <strong>Platform Improvement</strong>: Analyze usage patterns to enhance features</li>
              <li>• <strong>Security</strong>: Detect and prevent fraud, unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-400 mb-2">Protection Measures</h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• <strong>Encryption</strong>: All data encrypted in transit and at rest</li>
                <li>• <strong>Access Controls</strong>: Limited access on need-to-know basis</li>
                <li>• <strong>Regular Audits</strong>: Security assessments and penetration testing</li>
                <li>• <strong>Incident Response</strong>: Procedures for handling security breaches</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Privacy Rights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-purple-900/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-400 mb-2">Access and Control</h3>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Request copies of your personal data</li>
                  <li>• Update or correct inaccurate information</li>
                  <li>• Request deletion of your personal data</li>
                  <li>• Receive your data in portable format</li>
                </ul>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Communication</h3>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Opt out of promotional communications</li>
                  <li>• Control app and email notifications</li>
                  <li>• Required communications cannot be disabled</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact Us</h2>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-300 mb-2">For privacy-related questions or concerns:</p>
              <ul className="text-gray-300 space-y-1">
                <li><strong>Email</strong>: privacy@vonartis.app</li>
                <li><strong>Response Time</strong>: We respond to all privacy inquiries within 72 hours</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Regulatory Compliance</h2>
            <p className="text-gray-300">
              VonVault complies with applicable privacy laws including GDPR (European Union), CCPA (California), PIPEDA (Canada), and local financial privacy regulations.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              This Privacy Policy is effective as of June 20, 2025
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};