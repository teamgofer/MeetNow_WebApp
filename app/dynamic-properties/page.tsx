'use client';

import React from 'react';
import ExternalValueFactorsDisplay from '@/components/property/ExternalValueFactorsDisplay';

export default function DynamicPropertiesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Dynamic Property Valuation</h1>
      <p className="text-gray-600 mb-8">
        Properties in MeetNow are valued dynamically based on real-world external data sources
      </p>
      
      <div className="mb-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-3">Real-World Data Integration</h2>
        <p className="mb-4">
          MeetNow's virtual property marketplace uses data from multiple external sources to create a 
          dynamic and realistic valuation system. Property values fluctuate based on real-world metrics.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2">Population Density</h3>
            <p className="text-sm">
              Properties in densely populated areas are more valuable, just like in the real world.
              Data is sourced from census APIs and is updated regularly.
            </p>
          </div>
          
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2">Points of Interest</h3>
            <p className="text-sm">
              Proximity to businesses, attractions, and amenities impacts property values.
              Data is pulled from services like Google Places API and Yelp.
            </p>
          </div>
          
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2">Social Trends</h3>
            <p className="text-sm">
              Properties in trending areas gain value. We analyze social media mentions
              and search trends to identify up-and-coming locations.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Property Showcase</h2>
        <p className="text-gray-600 mb-6">
          Below are properties with values determined by external data sources. Each property's value
          is calculated using a weighted formula that combines multiple factors.
        </p>
        
        <ExternalValueFactorsDisplay />
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg">1. Data Collection</h3>
            <p className="text-gray-700">
              When a property is created or updated, our system contacts external APIs to gather
              current data about the location.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg">2. Factor Calculation</h3>
            <p className="text-gray-700">
              Each data point is normalized into a factor between 0.8 and 2.0, representing
              its impact on property value.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg">3. Weighted Valuation</h3>
            <p className="text-gray-700">
              A weighted formula combines these factors, with population density (50%),
              points of interest (30%), and trending data (20%).
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg">4. Regular Updates</h3>
            <p className="text-gray-700">
              Properties are automatically revalued on a regular schedule to reflect
              changing real-world conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 