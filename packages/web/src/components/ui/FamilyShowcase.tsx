// Showcase component to demonstrate family member components
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { FamilyAvatar } from './FamilyAvatar';
import { FamilyTag } from './FamilyTag';
import { FamilySelector } from './FamilySelector';
import { Button } from './Button';
import type { FamilyMember } from '../../types/theme';

export const FamilyShowcase = () => {
  const [selectedMembers, setSelectedMembers] = useState<FamilyMember[]>([]);
  const [singleSelection, setSingleSelection] = useState<FamilyMember[]>([]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Components Showcase</h1>
        <p className="text-gray-600">Interactive family member components for FAMAPP</p>
      </div>

      {/* Family Avatars */}
      <Card>
        <CardHeader>
          <CardTitle>Family Avatars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sizes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sizes</h3>
            <div className="flex items-center space-x-4">
              <FamilyAvatar member="gonzalo" size="xs" />
              <FamilyAvatar member="mpaz" size="sm" />
              <FamilyAvatar member="borja" size="md" />
              <FamilyAvatar member="melody" size="lg" />
              <FamilyAvatar member="gonzalo" size="xl" />
              <FamilyAvatar member="mpaz" size="2xl" />
            </div>
          </div>

          {/* Types */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Avatar Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Emoji</p>
                <div className="flex justify-center space-x-2">
                  <FamilyAvatar member="gonzalo" type="emoji" />
                  <FamilyAvatar member="mpaz" type="emoji" />
                  <FamilyAvatar member="borja" type="emoji" />
                  <FamilyAvatar member="melody" type="emoji" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Initials</p>
                <div className="flex justify-center space-x-2">
                  <FamilyAvatar member="gonzalo" type="initials" />
                  <FamilyAvatar member="mpaz" type="initials" />
                  <FamilyAvatar member="borja" type="initials" />
                  <FamilyAvatar member="melody" type="initials" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Photo Placeholder</p>
                <div className="flex justify-center space-x-2">
                  <FamilyAvatar member="gonzalo" type="photo" />
                  <FamilyAvatar member="mpaz" type="photo" />
                  <FamilyAvatar member="borja" type="photo" />
                  <FamilyAvatar member="melody" type="photo" />
                </div>
              </div>
            </div>
          </div>

          {/* With Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Indicators</h3>
            <div className="flex items-center space-x-4">
              <FamilyAvatar member="gonzalo" showStatus status="online" />
              <FamilyAvatar member="mpaz" showStatus status="away" />
              <FamilyAvatar member="borja" showStatus status="busy" />
              <FamilyAvatar member="melody" showStatus status="offline" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Family Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Default Style</h3>
            <div className="flex flex-wrap gap-2">
              <FamilyTag member="gonzalo" />
              <FamilyTag member="mpaz" />
              <FamilyTag member="borja" />
              <FamilyTag member="melody" />
            </div>
          </div>

          {/* With Roles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">With Roles</h3>
            <div className="flex flex-wrap gap-2">
              <FamilyTag member="gonzalo" showRole />
              <FamilyTag member="mpaz" showRole />
              <FamilyTag member="borja" showRole />
              <FamilyTag member="melody" showRole />
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Variants</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center w-16">Default:</span>
                <FamilyTag member="gonzalo" variant="default" />
                <FamilyTag member="mpaz" variant="default" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center w-16">Compact:</span>
                <FamilyTag member="borja" variant="compact" />
                <FamilyTag member="melody" variant="compact" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center w-16">Pill:</span>
                <FamilyTag member="gonzalo" variant="pill" />
                <FamilyTag member="mpaz" variant="pill" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center w-16">Minimal:</span>
                <FamilyTag member="borja" variant="minimal" />
                <FamilyTag member="melody" variant="minimal" />
              </div>
            </div>
          </div>

          {/* Interactive */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Interactive</h3>
            <div className="flex flex-wrap gap-2">
              <FamilyTag 
                member="gonzalo" 
                interactive 
                onClick={() => alert('Clicked Gonzalo!')}
              />
              <FamilyTag 
                member="mpaz" 
                interactive 
                onClick={() => alert('Clicked Mpaz!')}
              />
            </div>
          </div>

          {/* Different Avatar Types */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Avatar Types</h3>
            <div className="flex flex-wrap gap-2">
              <FamilyTag member="gonzalo" avatarType="emoji" />
              <FamilyTag member="mpaz" avatarType="initials" />
              <FamilyTag member="borja" avatarType="photo" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Family Selector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Grid Variant - Multiple Selection */}
          <div>
            <FamilySelector
              variant="grid"
              multiple
              selected={selectedMembers}
              onSelectionChange={setSelectedMembers}
              label="Multiple Selection (Grid)"
            />
            <div className="mt-2 text-sm text-gray-600">
              Selected: {selectedMembers.length > 0 ? selectedMembers.join(', ') : 'None'}
            </div>
          </div>

          {/* Dropdown Variant - Single Selection */}
          <div>
            <FamilySelector
              variant="dropdown"
              multiple={false}
              selected={singleSelection}
              onSelectionChange={setSingleSelection}
              label="Single Selection (Dropdown)"
              placeholder="Choose a family member"
            />
            <div className="mt-2 text-sm text-gray-600">
              Selected: {singleSelection.length > 0 ? singleSelection[0] : 'None'}
            </div>
          </div>

          {/* List Variant */}
          <div>
            <FamilySelector
              variant="list"
              multiple
              selected={selectedMembers}
              onSelectionChange={setSelectedMembers}
              label="Multiple Selection (List)"
            />
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedMembers([]);
                setSingleSelection([]);
              }}
            >
              Reset Selections
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Task Assignment Example */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-3">Task Assignment</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Buy groceries for the weekend</p>
                <div className="mt-1">
                  <FamilyTag member="mpaz" size="sm" />
                </div>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>

          {/* Event Participants Example */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-3">Event Participants</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">Family Movie Night</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Attending:</span>
                <FamilyAvatar member="gonzalo" size="xs" />
                <FamilyAvatar member="mpaz" size="xs" />
                <FamilyAvatar member="borja" size="xs" />
                <FamilyAvatar member="melody" size="xs" />
              </div>
            </div>
          </div>

          {/* Status Overview Example */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-3">Family Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <FamilyAvatar member="gonzalo" showStatus status="online" />
                <p className="text-xs text-gray-600 mt-1">Available</p>
              </div>
              <div className="text-center">
                <FamilyAvatar member="mpaz" showStatus status="away" />
                <p className="text-xs text-gray-600 mt-1">At work</p>
              </div>
              <div className="text-center">
                <FamilyAvatar member="borja" showStatus status="busy" />
                <p className="text-xs text-gray-600 mt-1">At school</p>
              </div>
              <div className="text-center">
                <FamilyAvatar member="melody" showStatus status="offline" />
                <p className="text-xs text-gray-600 mt-1">Sleeping</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};