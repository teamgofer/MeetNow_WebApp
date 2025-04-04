import React, { useState, useEffect } from 'react';
import StopwatchIcon from './StopwatchIcon';
import StopwatchCountdown from './StopwatchCountdown';

/**
 * Test component to visualize and test different states of the StopwatchIcon
 */
const StopwatchTest: React.FC = () => {
  const [colorScheme, setColorScheme] = useState<'A' | 'B'>('A');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'expired'>('low');
  const [useDigitalFormat, setUseDigitalFormat] = useState<boolean>(true);
  const [oneMinuteExpiry, setOneMinuteExpiry] = useState<Date>(new Date(Date.now() + 60000));
  const [adaptiveDuration, setAdaptiveDuration] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<'analog' | 'digital' | 'hybrid'>('analog');
  const [pillStyle, setPillStyle] = useState<boolean>(false);
  
  // Update one minute timer
  useEffect(() => {
    const updateOneMinuteTimer = () => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + 60); // Set to exactly 1 minute from now
      setOneMinuteExpiry(date);
    };
    
    updateOneMinuteTimer(); // Initial update
    
    // Refresh every minute
    const timer = setInterval(updateOneMinuteTimer, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Generate test expiry times for different durations
  const getExpiryTime = (minutesFromNow: number): Date => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutesFromNow);
    return date;
  };

  // Fixed expiry times for specific duration examples
  const expiry20min = getExpiryTime(20);
  const expiry45min = getExpiryTime(45);
  const expiry1hour = getExpiryTime(60);
  
  // Calculate and display the exact duration from now to expiry
  const getDurationFromNow = (expiryTime: Date): number => {
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Stopwatch Components Test</h1>
      
      <div className="space-y-8">
        {/* StopwatchIcon Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-bold mb-4">StopwatchIcon</h2>
          <div className="space-y-6">
            {/* Real-time animation test */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Continuous Rotation Animation</h3>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <StopwatchIcon 
                  colorScheme={colorScheme}
                  urgency={urgency}
                  size={40}
                />
                <span className="ml-2 font-mono">Full 360° rotation</span>
              </div>
            </div>
            
            {/* Color schemes */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Color Schemes</h3>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setColorScheme('A')}
                  className={`px-3 py-1 rounded-md ${colorScheme === 'A' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                >
                  Scheme A
                </button>
                <button 
                  onClick={() => setColorScheme('B')}
                  className={`px-3 py-1 rounded-md ${colorScheme === 'B' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}
                >
                  Scheme B
                </button>
              </div>
            </div>
            
            {/* Urgency states */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Urgency States</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-3 rounded-md flex items-center justify-center ${urgency === 'low' ? 'bg-gray-100' : 'bg-gray-50'} cursor-pointer`}
                  onClick={() => setUrgency('low')}
                >
                  <StopwatchIcon urgency="low" colorScheme={colorScheme} size={24} />
                  <span className="ml-2">Low (60s rotation)</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex items-center justify-center ${urgency === 'medium' ? 'bg-gray-100' : 'bg-gray-50'} cursor-pointer`}
                  onClick={() => setUrgency('medium')}
                >
                  <StopwatchIcon urgency="medium" colorScheme={colorScheme} size={24} />
                  <span className="ml-2">Medium (60s rotation)</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex items-center justify-center ${urgency === 'high' ? 'bg-gray-100' : 'bg-gray-50'} cursor-pointer`}
                  onClick={() => setUrgency('high')}
                >
                  <StopwatchIcon urgency="high" colorScheme={colorScheme} size={24} />
                  <span className="ml-2">High (3s rotation)</span>
                </div>
                <div 
                  className={`p-3 rounded-md flex items-center justify-center ${urgency === 'expired' ? 'bg-gray-100' : 'bg-gray-50'} cursor-pointer`}
                  onClick={() => setUrgency('expired')}
                >
                  <StopwatchIcon urgency="expired" colorScheme={colorScheme} size={24} />
                  <span className="ml-2">Expired (no animation)</span>
                </div>
              </div>
            </div>
            
            {/* Size variations */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Size Variations</h3>
              <div className="flex items-center justify-around p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center">
                  <StopwatchIcon size={16} colorScheme={colorScheme} urgency={urgency} />
                  <span className="mt-1 text-xs">16px</span>
                </div>
                <div className="flex flex-col items-center">
                  <StopwatchIcon size={24} colorScheme={colorScheme} urgency={urgency} />
                  <span className="mt-1 text-xs">24px</span>
                </div>
                <div className="flex flex-col items-center">
                  <StopwatchIcon size={32} colorScheme={colorScheme} urgency={urgency} />
                  <span className="mt-1 text-xs">32px</span>
                </div>
                <div className="flex flex-col items-center">
                  <StopwatchIcon size={48} colorScheme={colorScheme} urgency={urgency} />
                  <span className="mt-1 text-xs">48px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* StopwatchCountdown Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">StopwatchCountdown</h2>
          
          {/* Format toggle */}
          <div className="mb-4 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Display Settings</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Display Mode</h4>
                <div className="flex items-center space-x-4 mb-2">
                  <button 
                    onClick={() => setDisplayMode('analog')}
                    className={`px-3 py-1 rounded-md ${displayMode === 'analog' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Analog
                  </button>
                  <button 
                    onClick={() => setDisplayMode('digital')}
                    className={`px-3 py-1 rounded-md ${displayMode === 'digital' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Digital
                  </button>
                  <button 
                    onClick={() => setDisplayMode('hybrid')}
                    className={`px-3 py-1 rounded-md ${displayMode === 'hybrid' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Hybrid
                  </button>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={pillStyle}
                      onChange={() => setPillStyle(!pillStyle)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-600">Pill Style</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Time Format</h4>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setUseDigitalFormat(true)}
                    className={`px-3 py-1 rounded-md ${useDigitalFormat ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Digital (00:00)
                  </button>
                  <button 
                    onClick={() => setUseDigitalFormat(false)}
                    className={`px-3 py-1 rounded-md ${!useDigitalFormat ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Standard (5m)
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Rotation Speed</h4>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setAdaptiveDuration(true)}
                    className={`px-3 py-1 rounded-md ${adaptiveDuration ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Adaptive (1 rotation = full duration)
                  </button>
                  <button 
                    onClick={() => setAdaptiveDuration(false)}
                    className={`px-3 py-1 rounded-md ${!adaptiveDuration ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
                  >
                    Standard (fixed speed)
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* One Minute Countdown with Digital Display */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Exact One-Minute Countdown with Digital Display</h3>
            <div className="p-6 flex items-center justify-center bg-white rounded-lg shadow-inner text-xl">
              <StopwatchCountdown 
                expiryTime={oneMinuteExpiry} 
                colorScheme={colorScheme} 
                size={32}
                useDigitalFormat={true}
                className="text-xl"
                forceUrgency="high" 
                adaptiveDuration={false}
                displayMode={displayMode}
                pillStyle={pillStyle}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This timer will always start at exactly 01:00 and count down to 00:00 (with fast rotation)
            </p>
          </div>
          
          {/* One Minute Countdown with Minute Hand Rotation */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">One-Minute Countdown with Proper Hand Speed</h3>
            <div className="p-6 flex items-center justify-center bg-white rounded-lg shadow-inner text-xl">
              <StopwatchCountdown 
                expiryTime={oneMinuteExpiry} 
                colorScheme={colorScheme} 
                size={32}
                useDigitalFormat={true}
                className="text-xl"
                forceUrgency="low" 
                adaptiveDuration={false}
                displayMode={displayMode}
                pillStyle={pillStyle}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Uses "low" urgency for a full minute rotation with the digital display
            </p>
          </div>
          
          {/* Hybrid Display Examples */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Hybrid Display Examples</h3>
            <p className="text-xs text-gray-500 mb-4">
              Compact pill-shaped component showing both analog and digital displays
            </p>
            
            <div className="space-y-4">
              {/* Example row with different urgency levels */}
              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <StopwatchCountdown 
                  expiryTime={getExpiryTime(45)} 
                  colorScheme={colorScheme} 
                  size={18}
                  displayMode="hybrid"
                  pillStyle={true}
                  forceUrgency="low"
                />
                
                <StopwatchCountdown 
                  expiryTime={getExpiryTime(10)} 
                  colorScheme={colorScheme} 
                  size={18}
                  displayMode="hybrid"
                  pillStyle={true}
                  forceUrgency="medium"
                />
                
                <StopwatchCountdown 
                  expiryTime={getExpiryTime(3)} 
                  colorScheme={colorScheme} 
                  size={18}
                  displayMode="hybrid"
                  pillStyle={true}
                  forceUrgency="high"
                />
                
                <StopwatchCountdown 
                  expiryTime={getExpiryTime(-5)} 
                  colorScheme={colorScheme} 
                  size={18}
                  displayMode="hybrid"
                  pillStyle={true}
                />
              </div>
              
              {/* Custom sizes */}
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <h4 className="text-sm font-semibold mb-3">Different Sizes</h4>
                <div className="flex flex-wrap items-center gap-4 justify-center">
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(25)} 
                    colorScheme={colorScheme} 
                    size={14}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                  
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(25)} 
                    colorScheme={colorScheme} 
                    size={18}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                  
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(25)} 
                    colorScheme={colorScheme} 
                    size={22}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                </div>
              </div>
              
              {/* Color schemes */}
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <h4 className="text-sm font-semibold mb-3">Color Schemes</h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(30)} 
                    colorScheme="A" 
                    size={18}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                  
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(30)} 
                    colorScheme="B" 
                    size={18}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                </div>
              </div>
              
              {/* Integration examples */}
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <h4 className="text-sm font-semibold mb-3">Integration Examples</h4>
                
                {/* Meetup card like example */}
                <div className="p-3 rounded-xl border shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50/90 to-pink-50/80 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-sm">Coffee Meetup</h5>
                      <p className="text-xs text-purple-700/70">Downtown Cafe</p>
                    </div>
                    <span className="text-xs bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 px-2 py-0.5 rounded-full text-indigo-900 shadow-sm">
                      1.2km
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs bg-white/80 rounded-lg px-2 py-1.5 shadow-sm">
                    <span className="text-purple-700/70">
                      Expires in:
                    </span>
                    <StopwatchCountdown 
                      expiryTime={getExpiryTime(15)} 
                      colorScheme="A" 
                      size={14}
                      displayMode="hybrid"
                      pillStyle={true}
                    />
                  </div>
                </div>
                
                {/* Button example */}
                <button className="flex items-center justify-center space-x-2 w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg transition-colors">
                  <span>Start in</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(5)} 
                    colorScheme="A" 
                    size={16}
                    displayMode="hybrid"
                    pillStyle={true}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Duration-Based Examples Section */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold mb-4">Adaptive Duration Examples</h3>
            <p className="text-sm text-gray-600 mb-4">
              These examples show the stopwatch hand completing exactly one full revolution during the entire countdown period.
            </p>
            
            {/* 20 Minute Example */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">20-Minute Countdown (1 rotation)</h3>
              <div className="p-6 flex items-center justify-center bg-white rounded-lg shadow-inner text-xl">
                <StopwatchCountdown 
                  expiryTime={expiry20min} 
                  colorScheme={colorScheme} 
                  size={32}
                  useDigitalFormat={true}
                  className="text-xl"
                  adaptiveDuration={adaptiveDuration}
                  displayMode={displayMode}
                  pillStyle={pillStyle}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {adaptiveDuration ? 
                  `Hand completes one rotation in exactly ${getDurationFromNow(expiry20min)} seconds (≈20 minutes)` : 
                  "Using standard rotation speed based on urgency"
                }
              </p>
            </div>
            
            {/* 45 Minute Example */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">45-Minute Countdown (1 rotation)</h3>
              <div className="p-6 flex items-center justify-center bg-white rounded-lg shadow-inner text-xl">
                <StopwatchCountdown 
                  expiryTime={expiry45min} 
                  colorScheme={colorScheme} 
                  size={32}
                  useDigitalFormat={true}
                  className="text-xl"
                  adaptiveDuration={adaptiveDuration}
                  displayMode={displayMode}
                  pillStyle={pillStyle}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {adaptiveDuration ? 
                  `Hand completes one rotation in exactly ${getDurationFromNow(expiry45min)} seconds (≈45 minutes)` : 
                  "Using standard rotation speed based on urgency"
                }
              </p>
            </div>
            
            {/* 1 Hour Example */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">1-Hour Countdown (1 rotation)</h3>
              <div className="p-6 flex items-center justify-center bg-white rounded-lg shadow-inner text-xl">
                <StopwatchCountdown 
                  expiryTime={expiry1hour} 
                  colorScheme={colorScheme} 
                  size={32}
                  useDigitalFormat={true}
                  className="text-xl"
                  adaptiveDuration={adaptiveDuration}
                  displayMode={displayMode}
                  pillStyle={pillStyle}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {adaptiveDuration ? 
                  `Hand completes one rotation in exactly ${getDurationFromNow(expiry1hour)} seconds (≈60 minutes)` : 
                  "Using standard rotation speed based on urgency"
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Different countdown times */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Countdown Examples</h3>
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-gray-50 flex items-center">
                  <span className="w-20 text-sm text-gray-500">3 minutes:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(3)} 
                    colorScheme={colorScheme} 
                    size={20}
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
                <div className="p-3 rounded-md bg-gray-50 flex items-center">
                  <span className="w-20 text-sm text-gray-500">10 minutes:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(10)} 
                    colorScheme={colorScheme} 
                    size={20}
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
                <div className="p-3 rounded-md bg-gray-50 flex items-center">
                  <span className="w-20 text-sm text-gray-500">30 minutes:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(30)} 
                    colorScheme={colorScheme} 
                    size={20}
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
                <div className="p-3 rounded-md bg-gray-50 flex items-center">
                  <span className="w-20 text-sm text-gray-500">2 hours:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(120)} 
                    colorScheme={colorScheme} 
                    size={20}
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
                <div className="p-3 rounded-md bg-gray-50 flex items-center">
                  <span className="w-20 text-sm text-gray-500">Expired:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(-5)} 
                    colorScheme={colorScheme} 
                    size={20}
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
              </div>
            </div>
            
            {/* Neumorphic Design Test */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Neumorphic Integration Example</h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),_inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center text-xs bg-gradient-to-r from-white/80 via-gray-50/60 to-white/80 rounded-lg px-3 py-2 shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.8),_inset_1px_1px_2px_rgba(0,0,0,0.1)]">
                  <span className="text-gray-600">Expires in:</span>
                  <StopwatchCountdown 
                    expiryTime={getExpiryTime(15)} 
                    colorScheme={colorScheme} 
                    size={16}
                    className="text-xs"
                    useDigitalFormat={useDigitalFormat}
                    adaptiveDuration={adaptiveDuration}
                    displayMode={displayMode}
                    pillStyle={pillStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopwatchTest; 