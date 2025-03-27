import React, { useState } from 'react';
import './neumorphic.css';

// Import all components
import NeuButton from './NeuButton';
import NeuCard from './NeuCard';
import NeuIconButton from './NeuIconButton';
import NeuNavigation from './NeuNavigation';
import NeuIcon from './NeuIcon';
import NeuInput from './NeuInput';
import NeuCheckbox from './NeuCheckbox';
import NeuToggle from './NeuToggle';
import NeuSelect from './NeuSelect';
import NeuAlert from './NeuAlert';
import NeuProgress from './NeuProgress';
import NeuTabs from './NeuTabs';
import NeuModal from './NeuModal';
import NeuAvatar from './NeuAvatar';

// Import icons
import * as NavigationIcons from './icons/NavigationIcons';
import * as ActionIcons from './icons/ActionIcons';

const DemoSection = ({ title, children }) => (
  <div className="neu-demo-section">
    <h2 className="neu-demo-title">{title}</h2>
    <div className="neu-demo-content">
      {children}
    </div>
  </div>
);

const NeuComponentDemo = () => {
  // State for interactive components
  const [inputValue, setInputValue] = useState('');
  const [checkboxState, setCheckboxState] = useState(false);
  const [toggleState, setToggleState] = useState(true);
  const [selectValue, setSelectValue] = useState('option1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: <NavigationIcons.Home /> },
    { id: 'events', label: 'Events', icon: <NavigationIcons.Events /> },
    { id: 'profile', label: 'Profile', icon: <NavigationIcons.Profile /> },
    { id: 'messages', label: 'Messages', icon: <NavigationIcons.Messages /> },
  ];

  // Select options
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
  ];

  // Tab content
  const tabs = [
    { 
      id: 'tab1', 
      label: 'Tab 1', 
      content: <div className="neu-tab-panel">Content for Tab 1</div> 
    },
    { 
      id: 'tab2', 
      label: 'Tab 2', 
      icon: <ActionIcons.Info />,
      content: <div className="neu-tab-panel">Content for Tab 2 with an icon</div> 
    },
    { 
      id: 'tab3', 
      label: 'Tab 3', 
      content: <div className="neu-tab-panel">Content for Tab 3</div> 
    },
  ];

  return (
    <div className="neu-demo-container">
      <h1 className="neu-demo-header">MeetNow Neumorphic UI Components</h1>
      <p className="neu-demo-description">
        A showcase of the neumorphic UI components for the MeetNow platform.
      </p>

      {/* Buttons Section */}
      <DemoSection title="Buttons">
        <div className="neu-demo-row">
          <NeuButton>Default Button</NeuButton>
          <NeuButton variant="primary">Primary Button</NeuButton>
          <NeuButton variant="success">Success Button</NeuButton>
          <NeuButton variant="danger">Danger Button</NeuButton>
          <NeuButton variant="info">Info Button</NeuButton>
        </div>
        <div className="neu-demo-row">
          <NeuButton size="small">Small Button</NeuButton>
          <NeuButton size="medium">Medium Button</NeuButton>
          <NeuButton size="large">Large Button</NeuButton>
          <NeuButton disabled>Disabled Button</NeuButton>
        </div>
        <div className="neu-demo-row">
          <NeuButton icon={<ActionIcons.Add />}>Button with Icon</NeuButton>
        </div>
      </DemoSection>

      {/* Icon Buttons Section */}
      <DemoSection title="Icon Buttons">
        <div className="neu-demo-row">
          <NeuIconButton icon={<ActionIcons.Add />} />
          <NeuIconButton icon={<ActionIcons.Edit />} variant="primary" />
          <NeuIconButton icon={<ActionIcons.Delete />} variant="danger" />
          <NeuIconButton icon={<ActionIcons.Info />} variant="info" />
        </div>
        <div className="neu-demo-row">
          <NeuIconButton icon={<ActionIcons.Search />} size="small" />
          <NeuIconButton icon={<ActionIcons.Search />} size="medium" />
          <NeuIconButton icon={<ActionIcons.Search />} size="large" />
          <NeuIconButton icon={<ActionIcons.Search />} disabled />
        </div>
      </DemoSection>

      {/* Cards Section */}
      <DemoSection title="Cards">
        <div className="neu-demo-grid">
          <NeuCard 
            header="Default Card" 
            footer="Card Footer"
            className="neu-demo-card"
          >
            This is the content of a default card.
          </NeuCard>

          <NeuCard 
            variant="primary" 
            header="Primary Card" 
            className="neu-demo-card"
          >
            Card with primary styling.
          </NeuCard>

          <NeuCard 
            variant="luxury" 
            header="Luxury Card" 
            className="neu-demo-card"
          >
            Card with luxury styling.
          </NeuCard>

          <NeuCard 
            variant="playful" 
            header="Playful Card" 
            className="neu-demo-card"
          >
            Card with playful styling.
          </NeuCard>
        </div>
      </DemoSection>

      {/* Input Fields */}
      <DemoSection title="Input Fields">
        <div className="neu-demo-column">
          <NeuInput 
            label="Default Input" 
            placeholder="Type something..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          
          <NeuInput 
            label="Input with icon" 
            placeholder="Search..." 
            icon={<ActionIcons.Search />}
          />
          
          <NeuInput 
            label="Error input" 
            value="Invalid value"
            error={true}
            helperText="This field is required"
          />
          
          <NeuInput 
            label="Success input" 
            value="Valid value"
            success={true}
            helperText="Looks good!"
          />
          
          <NeuInput 
            label="Disabled input" 
            value="Can't edit this"
            disabled={true}
          />
        </div>
      </DemoSection>

      {/* Checkboxes */}
      <DemoSection title="Checkboxes & Toggles">
        <div className="neu-demo-column">
          <div className="neu-demo-row">
            <NeuCheckbox 
              label="Default checkbox" 
              checked={checkboxState}
              onChange={() => setCheckboxState(!checkboxState)}
            />

            <NeuCheckbox 
              label="Primary checkbox" 
              variant="primary" 
              checked={true}
              onChange={() => {}}
            />

            <NeuCheckbox 
              label="Disabled checkbox" 
              disabled={true}
              checked={false}
              onChange={() => {}}
            />
          </div>

          <div className="neu-demo-row">
            <NeuToggle 
              label="Default toggle" 
              checked={toggleState}
              onChange={() => setToggleState(!toggleState)}
            />

            <NeuToggle 
              label="Primary toggle" 
              variant="primary" 
              checked={true}
              onChange={() => {}}
            />

            <NeuToggle 
              label="Left label toggle" 
              labelPosition="left" 
              checked={true}
              onChange={() => {}}
            />

            <NeuToggle 
              label="Disabled toggle" 
              disabled={true}
              checked={false}
              onChange={() => {}}
            />
          </div>
        </div>
      </DemoSection>

      {/* Select Dropdown */}
      <DemoSection title="Select Dropdown">
        <div className="neu-demo-column">
          <NeuSelect 
            label="Default select" 
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
          />

          <NeuSelect 
            label="Primary select" 
            variant="primary"
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
          />

          <NeuSelect 
            label="Disabled select" 
            disabled={true}
            options={selectOptions}
            value={selectValue}
            onChange={setSelectValue}
          />
        </div>
      </DemoSection>

      {/* Alerts */}
      <DemoSection title="Alerts">
        <div className="neu-demo-column">
          <NeuAlert title="Info Alert">
            This is an informative message.
          </NeuAlert>

          <NeuAlert 
            title="Success Alert" 
            variant="success"
          >
            Operation completed successfully!
          </NeuAlert>

          <NeuAlert 
            title="Warning Alert" 
            variant="warning"
          >
            This action might cause issues.
          </NeuAlert>

          <NeuAlert 
            title="Error Alert" 
            variant="error"
            onClose={() => console.log('Alert closed')}
          >
            An error occurred while processing your request.
          </NeuAlert>
        </div>
      </DemoSection>

      {/* Progress */}
      <DemoSection title="Progress Bars">
        <div className="neu-demo-column">
          <NeuProgress 
            value={30} 
            label="Default Progress"
          />

          <NeuProgress 
            value={50} 
            label="Primary Progress"
            variant="primary"
          />

          <NeuProgress 
            value={70} 
            label="Success Progress"
            variant="success"
          />

          <NeuProgress 
            value={90} 
            label="Danger Progress"
            variant="danger"
          />
        </div>
      </DemoSection>

      {/* Tabs */}
      <DemoSection title="Tabs">
        <NeuTabs tabs={tabs} />
        
        <div style={{ marginTop: '20px' }}>
          <NeuTabs 
            tabs={tabs} 
            variant="primary"
            alignment="center"
          />
        </div>
      </DemoSection>

      {/* Navigation */}
      <DemoSection title="Navigation">
        <NeuNavigation 
          items={navItems} 
          variant="default"
        />
        
        <div style={{ marginTop: '20px' }}>
          <NeuNavigation 
            items={navItems} 
            variant="neumorphic"
            position="bottom"
          />
        </div>
      </DemoSection>

      {/* Avatars */}
      <DemoSection title="Avatars">
        <div className="neu-demo-row">
          <NeuAvatar 
            initials="JD" 
            size="small"
          />
          
          <NeuAvatar 
            initials="JD" 
            size="medium"
          />
          
          <NeuAvatar 
            initials="JD" 
            size="large"
          />
          
          <NeuAvatar 
            src="https://via.placeholder.com/150"
            alt="Jane Doe"
            size="large"
          />
          
          <NeuAvatar 
            icon={<ActionIcons.Profile />}
            size="large"
            variant="primary"
          />
        </div>
        
        <div className="neu-demo-row">
          <NeuAvatar 
            initials="JD"
            status="online"
          />
          
          <NeuAvatar 
            initials="JD"
            status="away"
          />
          
          <NeuAvatar 
            initials="JD"
            status="busy"
          />
          
          <NeuAvatar 
            initials="JD"
            status="offline"
          />
        </div>
      </DemoSection>

      {/* Modal */}
      <DemoSection title="Modal">
        <NeuButton 
          onClick={() => setIsModalOpen(true)}
        >
          Open Modal
        </NeuButton>
        
        <NeuModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <NeuButton 
                variant="minimal" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </NeuButton>
              <NeuButton 
                variant="primary" 
                onClick={() => setIsModalOpen(false)}
              >
                Confirm
              </NeuButton>
            </div>
          }
        >
          <p>This is an example modal dialog with neumorphic styling.</p>
          <p>You can put any content here, like forms, information, or confirmation messages.</p>
          <NeuInput 
            label="Sample input in modal" 
            placeholder="Type something..." 
          />
        </NeuModal>
      </DemoSection>
    </div>
  );
};

export default NeuComponentDemo; 