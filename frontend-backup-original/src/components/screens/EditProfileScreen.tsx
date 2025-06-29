import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useApp } from '../../context/AppContext';

export const EditProfileScreen: React.FC<ScreenProps> = ({ onBack }) => {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.replace(/^\+\d+/, '') || '', // Remove country code
    countryCode: user?.phone?.match(/^\+\d+/)?.[0] || '+1'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(form.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user data
      const updatedUser = {
        ...user,
        name: form.name,
        email: form.email,
        phone: form.countryCode + form.phone
      };
      
      setUser(updatedUser);
      alert('Profile updated successfully!');
      onBack?.();
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Edit Profile" onBack={onBack} />

      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Enter your full name"
              required
              error={errors.name}
            />

            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="Enter your email address"
              required
              error={errors.email}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-white">
                Phone Number <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  className="p-3 bg-gray-900 border border-purple-500 rounded-lg text-white focus:border-purple-400 focus:outline-none w-48"
                >
                  <option value="+1">🇺🇸 United States (+1)</option>
                  <option value="+1">🇨🇦 Canada (+1)</option>
                  <option value="+44">🇬🇧 United Kingdom (+44)</option>
                  <option value="+33">🇫🇷 France (+33)</option>
                  <option value="+49">🇩🇪 Germany (+49)</option>
                  <option value="+39">🇮🇹 Italy (+39)</option>
                  <option value="+34">🇪🇸 Spain (+34)</option>
                  <option value="+31">🇳🇱 Netherlands (+31)</option>
                  <option value="+32">🇧🇪 Belgium (+32)</option>
                  <option value="+41">🇨🇭 Switzerland (+41)</option>
                  <option value="+43">🇦🇹 Austria (+43)</option>
                  <option value="+45">🇩🇰 Denmark (+45)</option>
                  <option value="+46">🇸🇪 Sweden (+46)</option>
                  <option value="+47">🇳🇴 Norway (+47)</option>
                  <option value="+358">🇫🇮 Finland (+358)</option>
                  <option value="+86">🇨🇳 China (+86)</option>
                  <option value="+81">🇯🇵 Japan (+81)</option>
                  <option value="+82">🇰🇷 South Korea (+82)</option>
                  <option value="+91">🇮🇳 India (+91)</option>
                  <option value="+852">🇭🇰 Hong Kong (+852)</option>
                  <option value="+65">🇸🇬 Singapore (+65)</option>
                  <option value="+61">🇦🇺 Australia (+61)</option>
                  <option value="+64">🇳🇿 New Zealand (+64)</option>
                  <option value="+55">🇧🇷 Brazil (+55)</option>
                  <option value="+52">🇲🇽 Mexico (+52)</option>
                  <option value="+54">🇦🇷 Argentina (+54)</option>
                  <option value="+56">🇨🇱 Chile (+56)</option>
                  <option value="+57">🇨🇴 Colombia (+57)</option>
                  <option value="+51">🇵🇪 Peru (+51)</option>
                  <option value="+27">🇿🇦 South Africa (+27)</option>
                  <option value="+234">🇳🇬 Nigeria (+234)</option>
                  <option value="+20">🇪🇬 Egypt (+20)</option>
                  <option value="+971">🇦🇪 UAE (+971)</option>
                  <option value="+966">🇸🇦 Saudi Arabia (+966)</option>
                  <option value="+90">🇹🇷 Turkey (+90)</option>
                  <option value="+7">🇷🇺 Russia (+7)</option>
                  <option value="+380">🇺🇦 Ukraine (+380)</option>
                  <option value="+48">🇵🇱 Poland (+48)</option>
                  <option value="+420">🇨🇿 Czech Republic (+420)</option>
                  <option value="+36">🇭🇺 Hungary (+36)</option>
                  <option value="+40">🇷🇴 Romania (+40)</option>
                  <option value="+30">🇬🇷 Greece (+30)</option>
                  <option value="+351">🇵🇹 Portugal (+351)</option>
                  <option value="+353">🇮🇪 Ireland (+353)</option>
                  <option value="+60">🇲🇾 Malaysia (+60)</option>
                  <option value="+66">🇹🇭 Thailand (+66)</option>
                  <option value="+84">🇻🇳 Vietnam (+84)</option>
                  <option value="+63">🇵🇭 Philippines (+63)</option>
                  <option value="+62">🇮🇩 Indonesia (+62)</option>
                </select>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="123 456 7890"
                  required
                  error={errors.phone}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-3">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-white font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Account Created:</span>
              <span className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Authentication Method:</span>
              <span className="text-white">{user?.auth_type || 'Email'}</span>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={loading}
            fullWidth
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            Save Changes
          </Button>
          
          <Button
            onClick={onBack}
            variant="secondary"
            fullWidth
            size="lg"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};