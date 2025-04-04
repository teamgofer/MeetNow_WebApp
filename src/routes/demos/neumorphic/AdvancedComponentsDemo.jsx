import React, { useState } from 'react';
import './neumorphic.css';

// Import base components
import * as ActionIcons from './icons/ActionIcons';
import * as NavigationIcons from './icons/NavigationIcons';
import { NeuAccordion, NeuAccordionItem } from './NeuAccordion';
import NeuButton from './NeuButton';
import NeuCard from './NeuCard';
import NeuCarousel from './NeuCarousel';
import NeuColorPicker from './NeuColorPicker';
import NeuGlassCard from './NeuGlassCard';
import NeuGradientButton from './NeuGradientButton';
import NeuIcon from './NeuIcon';
import NeuIconButton from './NeuIconButton';

// Import advanced components
import NeuSkeleton from './NeuSkeleton';
import NeuSlider from './NeuSlider';

// Import icons

const DemoSection = ({ title, children }) => (
  <div className="neu-demo-section">
    <h2 className="neu-demo-title">{title}</h2>
    <div className="neu-demo-content">{children}</div>
  </div>
);

const AdvancedComponentsDemo = () => {
  // State hooks for interactive components
  const [sliderValue, setSliderValue] = useState(50);
  const [colorValue, setColorValue] = useState('#3f51b5');
  const [gradientColor1, setGradientColor1] = useState('#ff512f');
  const [gradientColor2, setGradientColor2] = useState('#dd2476');

  // Carousel slides
  const carouselSlides = [
    <div className="neu-demo-carousel-slide" key="slide1">
      <h3>Slide 1</h3>
      <p>This is a neumorphic carousel with smooth transitions</p>
      <NeuButton variant="primary">Learn More</NeuButton>
    </div>,
    <div className="neu-demo-carousel-slide" key="slide2">
      <h3>Slide 2</h3>
      <p>It supports multiple animation types including fade, slide, and zoom</p>
      <NeuIconButton icon={<ActionIcons.Like />} variant="primary" />
    </div>,
    <div className="neu-demo-carousel-slide" key="slide3">
      <h3>Slide 3</h3>
      <p>You can customize controls, indicators, and auto-play options</p>
      <NeuGradientButton animated>Animated Button</NeuGradientButton>
    </div>,
  ];

  return (
    <div className="neu-demo-container">
      <h1 className="neu-demo-header">Advanced Neumorphic Components</h1>
      <p className="neu-demo-description">
        A showcase of advanced UI components with neumorphic styling, animations, and effects.
      </p>

      {/* Skeleton Loaders Section */}
      <DemoSection title="Skeleton Loaders">
        <div className="neu-skeleton-demo">
          <NeuSkeleton variant="text" count={3} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <NeuSkeleton variant="circle" width="60px" height="60px" />
            <div style={{ flex: 1 }}>
              <NeuSkeleton variant="text" height="0.9rem" width="50%" />
              <NeuSkeleton variant="text" height="0.7rem" width="70%" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <NeuSkeleton variant="card" height="120px" width="150px" />
            <NeuSkeleton variant="card" height="120px" width="150px" />
            <NeuSkeleton variant="card" height="120px" width="150px" />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <NeuSkeleton variant="button" animation="wave" />
            <NeuSkeleton variant="button" animation="shine" />
            <NeuSkeleton variant="button" animation="none" />
          </div>
        </div>
      </DemoSection>

      {/* Accordion Section */}
      <DemoSection title="Accordions">
        <div className="neu-demo-accordion">
          <NeuAccordion>
            <NeuAccordionItem title="What is Neumorphism?" icon={<ActionIcons.Info />}>
              <p>
                Neumorphism is a design trend that combines elements of skeuomorphism and flat
                design. It features soft, extruded shapes, achieved through subtle shadow contrasts
                that give UI elements the appearance of being pushed out from the background.
              </p>
            </NeuAccordionItem>

            <NeuAccordionItem title="How to use these components" icon={<ActionIcons.Question />}>
              <p>
                These components can be easily integrated into your React projects. Simply import
                the desired component and include it in your JSX. Each component accepts various
                props for customization, such as variant, size, and specific features.
              </p>
              <NeuCard className="neu-demo-code" style={{ marginTop: '10px', padding: '10px' }}>
                <pre>
                  {`import { NeuAccordion, NeuAccordionItem } from './NeuAccordion';
                  
<NeuAccordion>
  <NeuAccordionItem title="Accordion Title">
    Content goes here...
  </NeuAccordionItem>
</NeuAccordion>`}
                </pre>
              </NeuCard>
            </NeuAccordionItem>

            <NeuAccordionItem title="Customization Options" icon={<ActionIcons.Edit />}>
              <p>All components can be customized with different:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Variants (default, primary, minimal, etc.)</li>
                <li>Sizes (small, medium, large)</li>
                <li>States (disabled, active, etc.)</li>
                <li>Animations and effects</li>
                <li>Colors and gradients</li>
              </ul>
            </NeuAccordionItem>
          </NeuAccordion>
        </div>
      </DemoSection>

      {/* Sliders Section */}
      <DemoSection title="Interactive Sliders">
        <div className="neu-demo-sliders">
          <NeuSlider
            label="Default Slider"
            value={sliderValue}
            onChange={setSliderValue}
            showValue
          />

          <NeuSlider
            label="Primary Variant with Custom Range"
            min={0}
            max={1000}
            step={10}
            value={200}
            variant="primary"
            showValue
            valueSuffix=" units"
          />

          <NeuSlider
            label="Success Variant (Small)"
            value={75}
            variant="success"
            size="small"
            showValue
            valuePrefix="Progress: "
            valueSuffix="%"
          />

          <NeuSlider
            label="Gradient Slider (Large)"
            value={60}
            variant="gradient"
            size="large"
            showValue
          />
        </div>
      </DemoSection>

      {/* Glassmorphism Section */}
      <DemoSection title="Glassmorphism Cards">
        <div className="neu-demo-glassmorphism">
          <h3 className="neu-demo-glassmorphism-title">Glassmorphism Effects</h3>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <NeuGlassCard header="Default Glass Card" style={{ width: '250px' }}>
              Glassmorphism features transparency, blur effects, and subtle borders for a modern,
              elegant look.
            </NeuGlassCard>

            <NeuGlassCard
              header="Primary Variant"
              variant="primary"
              blur="heavy"
              style={{ width: '250px' }}
            >
              This card has a primary color tint with heavier blur effect.
            </NeuGlassCard>

            <NeuGlassCard
              header="Rainbow Effect"
              variant="rainbow"
              blur="light"
              style={{ width: '250px' }}
            >
              This card features an animated rainbow gradient background effect.
            </NeuGlassCard>
          </div>
        </div>
      </DemoSection>

      {/* Carousel Section */}
      <DemoSection title="Animated Carousel">
        <div className="neu-demo-carousel">
          <NeuCarousel
            slides={carouselSlides}
            autoPlay
            interval={5000}
            animation="fade"
            variant="glass"
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <NeuButton size="small">Slide Animation</NeuButton>
          <NeuButton size="small" variant="primary">
            Fade Animation
          </NeuButton>
          <NeuButton size="small">Zoom Animation</NeuButton>
        </div>
      </DemoSection>

      {/* Color Picker Section */}
      <DemoSection title="Color Pickers">
        <div className="neu-demo-color-pickers">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}
          >
            <NeuColorPicker
              label="Basic Color Picker"
              value={colorValue}
              onChange={setColorValue}
            />
            <span>Selected: {colorValue}</span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}
          >
            <NeuColorPicker
              label="With Alpha Channel"
              value="#3f51b599"
              showAlpha
              variant="primary"
            />
            <span>With transparency</span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}
          >
            <NeuColorPicker
              label="Primary Gradient"
              value={gradientColor1}
              onChange={setGradientColor1}
              variant="inset"
            />
            <span>Start Color</span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}
          >
            <NeuColorPicker
              label="Primary Gradient"
              value={gradientColor2}
              onChange={setGradientColor2}
              variant="minimal"
            />
            <span>End Color</span>
          </div>
        </div>
      </DemoSection>

      {/* Gradient Buttons Section */}
      <DemoSection title="Gradient Buttons">
        <div className="neu-demo-gradients">
          <NeuGradientButton>Default Gradient</NeuGradientButton>

          <NeuGradientButton variant="primary" icon={<ActionIcons.Add />}>
            With Icon
          </NeuGradientButton>

          <NeuGradientButton variant="success" rounded>
            Rounded Style
          </NeuGradientButton>

          <NeuGradientButton variant="danger" icon={<ActionIcons.Delete />} iconPosition="right">
            Icon Right
          </NeuGradientButton>

          <NeuGradientButton variant="warning" pulse>
            Pulse Effect
          </NeuGradientButton>

          <NeuGradientButton variant="info" sheen>
            Sheen Effect
          </NeuGradientButton>

          <NeuGradientButton variant="ocean" ripple>
            Ripple Effect
          </NeuGradientButton>

          <NeuGradientButton variant="sunset" startColor={gradientColor1} endColor={gradientColor2}>
            Custom Colors
          </NeuGradientButton>

          <NeuGradientButton variant="rainbow" animated animationSpeed="slow">
            Animated Rainbow
          </NeuGradientButton>

          <NeuGradientButton gradientType="radial" startColor="#00c6ff" endColor="#0072ff">
            Radial Gradient
          </NeuGradientButton>
        </div>
      </DemoSection>

      {/* Combined Demo Section */}
      <DemoSection title="Combined Components">
        <NeuCard
          header={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Interactive Demo</span>
              <NeuIconButton icon={<ActionIcons.Settings />} size="small" />
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <NeuButton variant="minimal" size="small">
                Cancel
              </NeuButton>
              <NeuGradientButton size="small" variant="primary" sheen>
                Save Changes
              </NeuGradientButton>
            </div>
          }
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <div style={{ padding: '20px 0' }}>
            <NeuAccordion>
              <NeuAccordionItem title="Color Theme" icon={<ActionIcons.ColorPalette />}>
                <div style={{ padding: '15px 0' }}>
                  <label style={{ display: 'block', marginBottom: '10px' }}>Primary Color</label>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <NeuColorPicker value={colorValue} onChange={setColorValue} variant="primary" />
                    <span style={{ flex: 1 }}>{colorValue}</span>
                  </div>

                  <NeuSlider
                    label="Opacity"
                    value={75}
                    min={0}
                    max={100}
                    showValue
                    valueSuffix="%"
                    style={{ marginTop: '15px' }}
                  />
                </div>
              </NeuAccordionItem>

              <NeuAccordionItem title="Gradient Settings" icon={<ActionIcons.Gradient />}>
                <div style={{ padding: '15px 0' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>Start Color</label>
                      <NeuColorPicker value={gradientColor1} onChange={setGradientColor1} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>End Color</label>
                      <NeuColorPicker value={gradientColor2} onChange={setGradientColor2} />
                    </div>
                  </div>

                  <NeuSlider
                    label="Gradient Angle"
                    value={45}
                    min={0}
                    max={360}
                    showValue
                    valueSuffix="°"
                  />

                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Preview</label>
                    <div
                      style={{
                        height: '50px',
                        borderRadius: '8px',
                        background: `linear-gradient(${45}deg, ${gradientColor1}, ${gradientColor2})`,
                        boxShadow: 'var(--neu-shadow-small)',
                      }}
                    />
                  </div>
                </div>
              </NeuAccordionItem>
            </NeuAccordion>
          </div>
        </NeuCard>
      </DemoSection>
    </div>
  );
};

export default AdvancedComponentsDemo;
