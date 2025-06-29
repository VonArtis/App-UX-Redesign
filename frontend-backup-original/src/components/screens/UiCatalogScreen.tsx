import React from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const UiCatalogScreen: React.FC<ScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="UI Catalog" onBack={onBack} />

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold mb-4">Buttons</h2>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex space-x-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <Button loading fullWidth>Loading Button</Button>
            <Button disabled fullWidth>Disabled Button</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold mb-4">Text Fields</h2>
          <div className="space-y-3">
            <Input
              label="Basic Input"
              value=""
              onChange={() => {}}
              placeholder="Enter text here"
            />
            <Input
              label="Input with Prefix"
              value=""
              onChange={() => {}}
              placeholder="0.00"
              prefix="$"
            />
            <Input
              label="Required Input"
              value=""
              onChange={() => {}}
              placeholder="Required field"
              required
            />
            <Input
              label="Input with Error"
              value=""
              onChange={() => {}}
              placeholder="Error state"
              error="This field has an error"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold mb-4">Cards</h2>
          <div className="space-y-3">
            <Card>
              <h3 className="font-semibold mb-2">Basic Card</h3>
              <p className="text-gray-400">This is a basic card component.</p>
            </Card>
            <Card hover>
              <h3 className="font-semibold mb-2">Hoverable Card</h3>
              <p className="text-gray-400">This card has hover effects.</p>
            </Card>
            <Card onClick={() => alert('Card clicked!')} hover>
              <h3 className="font-semibold mb-2">Clickable Card</h3>
              <p className="text-gray-400">This card is clickable.</p>
            </Card>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold mb-4">Loading States</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="sm" />
              <span>Small Spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="md" />
              <span>Medium Spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="lg" />
              <span>Large Spinner</span>
            </div>
            <LoadingSpinner text="Loading with text..." />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold mb-4">Colors</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-purple-600 rounded flex items-center justify-center text-white font-semibold">Purple</div>
            <div className="h-12 bg-green-600 rounded flex items-center justify-center text-white font-semibold">Green</div>
            <div className="h-12 bg-orange-600 rounded flex items-center justify-center text-white font-semibold">Orange</div>
            <div className="h-12 bg-red-600 rounded flex items-center justify-center text-white font-semibold">Red</div>
            <div className="h-12 bg-gray-600 rounded flex items-center justify-center text-white font-semibold">Gray</div>
            <div className="h-12 bg-gray-900 border border-gray-600 rounded flex items-center justify-center text-white font-semibold">Dark</div>
          </div>
        </Card>
      </div>
    </div>
  );
};