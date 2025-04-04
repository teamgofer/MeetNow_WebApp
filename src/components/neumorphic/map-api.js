/**
 * Map API Utilities for Neumorphic UI
 * This file provides functionality for fetching real-time data from various APIs
 * for use with map overlays.
 */

window.mapAPI = (function () {
  /**
   * OpenAQ API utilities for pollution data
   */
  const pollution = {
    /**
     * Fetch pollution data from OpenAQ API for a specific location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} radius - Radius in kilometers (default 10)
     * @returns {Promise<Array>} - Array of pollution data points
     */
    async fetchData(lat, lon, radius = 10) {
      try {
        // OpenAQ API endpoint for latest air quality data
        const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=${radius}&limit=10&page=1&offset=0&sort=desc`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }

        const data = await response.json();

        // Extract and format the results
        if (data.results && data.results.length > 0) {
          return data.results
            .map(result => {
              // Calculate AQI from PM2.5 values if available
              let aqi = null;
              const pm25 = result.measurements.find(m => m.parameter === 'pm25');

              if (pm25) {
                aqi = this.calculateAQI(pm25.value);
              }

              // Generate random position for demo if we don't have exact coordinates
              // In a real app, you would use the exact coordinates
              const randomOffset = () => (Math.random() - 0.5) * 20;

              return {
                stationName: result.location,
                coordinates: result.coordinates || {
                  latitude: lat + randomOffset() * 0.01,
                  longitude: lon + randomOffset() * 0.01,
                },
                aqi: aqi,
                measurements: result.measurements.reduce((acc, m) => {
                  acc[m.parameter] = { value: m.value, unit: m.unit };
                  return acc;
                }, {}),
              };
            })
            .filter(result => result.aqi !== null);
        }

        return [];
      } catch (error) {
        console.error('Error fetching pollution data:', error);
        return [];
      }
    },

    /**
     * Calculate AQI from PM2.5 value
     * Based on EPA AQI calculation for PM2.5
     * @param {number} pm25 - PM2.5 value in μg/m³
     * @returns {number} - AQI value
     */
    calculateAQI(pm25) {
      // AQI breakpoints for PM2.5
      const breakpoints = [
        { min: 0, max: 12, minAQI: 0, maxAQI: 50 }, // Good
        { min: 12.1, max: 35.4, minAQI: 51, maxAQI: 100 }, // Moderate
        { min: 35.5, max: 55.4, minAQI: 101, maxAQI: 150 }, // Unhealthy for Sensitive Groups
        { min: 55.5, max: 150.4, minAQI: 151, maxAQI: 200 }, // Unhealthy
        { min: 150.5, max: 250.4, minAQI: 201, maxAQI: 300 }, // Very Unhealthy
        { min: 250.5, max: 500.4, minAQI: 301, maxAQI: 500 }, // Hazardous
      ];

      // Find the appropriate breakpoint
      for (const bp of breakpoints) {
        if (pm25 >= bp.min && pm25 <= bp.max) {
          // Linear interpolation formula
          return Math.round(
            ((bp.maxAQI - bp.minAQI) / (bp.max - bp.min)) * (pm25 - bp.min) + bp.minAQI
          );
        }
      }

      // If PM2.5 is above the highest breakpoint
      if (pm25 > breakpoints[breakpoints.length - 1].max) {
        return 500;
      }

      return 0;
    },

    /**
     * Get color for AQI value
     * @param {number} aqi - AQI value
     * @returns {string} - Color in hex format
     */
    getAQIColor(aqi) {
      if (aqi <= 50) return '#00e400'; // Good
      if (aqi <= 100) return '#ffff00'; // Moderate
      if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups
      if (aqi <= 200) return '#ff0000'; // Unhealthy
      if (aqi <= 300) return '#99004c'; // Very Unhealthy
      return '#7e0023'; // Hazardous
    },

    /**
     * Get description for AQI value
     * @param {number} aqi - AQI value
     * @returns {string} - AQI description
     */
    getAQIDescription(aqi) {
      if (aqi <= 50) return 'Good';
      if (aqi <= 100) return 'Moderate';
      if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
      if (aqi <= 200) return 'Unhealthy';
      if (aqi <= 300) return 'Very Unhealthy';
      return 'Hazardous';
    },
  };

  /**
   * Sunshine data utilities using Sunrise-Sunset API
   */
  const sunshine = {
    /**
     * Fetch sunshine data from Sunrise-Sunset API
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Sunshine data
     */
    async fetchData(lat, lon) {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK') {
          const sunriseTime = new Date(data.results.sunrise);
          const sunsetTime = new Date(data.results.sunset);
          const now = new Date();

          // Calculate how long until sunrise/sunset
          const timeUntilSunrise = sunriseTime - now;
          const timeUntilSunset = sunsetTime - now;

          // Get sun position (simplified for demo)
          const dayLength = sunsetTime - sunriseTime;
          const timeSinceSunrise = now - sunriseTime;

          let sunPosition = 0;
          if (now < sunriseTime) {
            sunPosition = 0; // Before sunrise
          } else if (now > sunsetTime) {
            sunPosition = 1; // After sunset
          } else {
            sunPosition = timeSinceSunrise / dayLength; // Between 0 and 1
          }

          // Calculate sun areas (morning, afternoon, all-day)
          const sunAreas = this.calculateSunAreas(sunPosition, sunriseTime, sunsetTime);

          return {
            sunrise: sunriseTime,
            sunset: sunsetTime,
            dayLength: dayLength,
            sunPosition: sunPosition,
            isDay: now > sunriseTime && now < sunsetTime,
            civilTwilight: {
              begin: new Date(data.results.civil_twilight_begin),
              end: new Date(data.results.civil_twilight_end),
            },
            formattedTime: {
              sunrise: this.formatTime(sunriseTime),
              sunset: this.formatTime(sunsetTime),
              dayLength: this.formatDuration(dayLength),
            },
            sunAreas: sunAreas,
          };
        }

        throw new Error('Unable to fetch sunshine data');
      } catch (error) {
        console.error('Error fetching sunshine data:', error);
        return null;
      }
    },

    /**
     * Format time to display
     * @param {Date} date - Date object
     * @returns {string} - Formatted time
     */
    formatTime(date) {
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    },

    /**
     * Format duration in milliseconds to hours and minutes
     * @param {number} duration - Duration in milliseconds
     * @returns {string} - Formatted duration
     */
    formatDuration(duration) {
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    },

    /**
     * Calculate sun areas for different times of day
     * @param {number} sunPosition - Current sun position (0 to 1)
     * @param {Date} sunrise - Sunrise time
     * @param {Date} sunset - Sunset time
     * @returns {Array} - Array of sun areas
     */
    calculateSunAreas(sunPosition, sunrise, sunset) {
      const now = new Date();
      const isMorning =
        now >= sunrise && now < new Date(sunrise.getTime() + (sunset - sunrise) * 0.4);
      const isAfternoon =
        now >= new Date(sunrise.getTime() + (sunset - sunrise) * 0.6) && now < sunset;

      // Random areas for now - in a real app you would use solar position calculations
      // to determine which areas get sun at different times of day
      return [
        {
          x: 25 + Math.random() * 10,
          y: 35 + Math.random() * 10,
          radius: 15 + Math.random() * 5,
          label: 'Morning Sun',
          active: isMorning,
        },
        {
          x: 65 + Math.random() * 10,
          y: 45 + Math.random() * 10,
          radius: 20 + Math.random() * 5,
          label: 'All Day Sun',
          active: sunPosition > 0 && sunPosition < 1,
        },
        {
          x: 40 + Math.random() * 10,
          y: 75 + Math.random() * 10,
          radius: 12 + Math.random() * 5,
          label: 'Afternoon Sun',
          active: isAfternoon,
        },
      ];
    },
  };

  /**
   * Weather data utilities using Open-Meteo API
   */
  const weather = {
    /**
     * Fetch weather data from Open-Meteo API
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Weather data
     */
    async fetchData(lat, lon) {
      try {
        // Get current weather and hourly forecast for precipitation
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,rain,snowfall,cloud_cover,wind_speed_10m&hourly=precipitation_probability,precipitation&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }

        const data = await response.json();

        if (data.current) {
          // Calculate rain intensity for visualization
          let rainIntensity = 0;
          if (data.current.rain > 0) {
            rainIntensity = Math.min(data.current.rain / 10, 1); // Scale 0-10mm to 0-1
          } else if (data.current.snowfall > 0) {
            rainIntensity = Math.min(data.current.snowfall / 5, 1); // Scale 0-5cm to 0-1
          }

          // Get precipitation probability for next few hours
          const precipProb = data.hourly.precipitation_probability.slice(0, 6);
          const maxPrecipProb = Math.max(...precipProb);

          // Weather type based on current conditions
          let weatherType = 'clear';
          if (data.current.rain > 0) {
            weatherType = 'rain';
          } else if (data.current.snowfall > 0) {
            weatherType = 'snow';
          } else if (data.current.cloud_cover > 80) {
            weatherType = 'cloudy';
          } else if (data.current.cloud_cover > 30) {
            weatherType = 'partly-cloudy';
          }

          return {
            temperature: data.current.temperature_2m,
            temperatureUnit: data.current_units.temperature_2m,
            rainAmount: data.current.rain,
            rainUnit: data.current_units.rain,
            snowAmount: data.current.snowfall,
            snowUnit: data.current_units.snowfall,
            cloudCover: data.current.cloud_cover,
            windSpeed: data.current.wind_speed_10m,
            windSpeedUnit: data.current_units.wind_speed_10m,
            weatherType: weatherType,
            rainIntensity: rainIntensity,
            precipitationProbability: maxPrecipProb,
            forecast: {
              precipProb: precipProb,
              precipAmount: data.hourly.precipitation.slice(0, 6),
            },
          };
        }

        throw new Error('Unable to fetch weather data');
      } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
      }
    },

    /**
     * Get icon class for weather type
     * @param {string} weatherType - Weather type
     * @returns {string} - CSS class for weather icon
     */
    getWeatherIconClass(weatherType) {
      switch (weatherType) {
        case 'rain':
          return 'neu-weather-icon-rain';
        case 'snow':
          return 'neu-weather-icon-snow';
        case 'cloudy':
          return 'neu-weather-icon-cloudy';
        case 'partly-cloudy':
          return 'neu-weather-icon-partly-cloudy';
        default:
          return 'neu-weather-icon-clear';
      }
    },
  };

  /**
   * Traffic data utilities
   * Note: Free traffic APIs typically require API keys, so this is a placeholder
   * that would need to be connected to an actual service in production
   */
  const traffic = {
    /**
     * Generate simulated traffic data around a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Traffic data
     */
    async fetchData(lat, lon) {
      try {
        // In a real app, you would call an actual traffic API here
        // For this demo, we'll generate simulated data

        // Generate a grid of roads
        const roads = [];

        // Main roads (horizontal)
        for (let i = 0; i < 3; i++) {
          const y = 20 + i * 30;
          const congestion = this.randomCongestion();
          roads.push({
            start: { x: 10, y: y },
            end: { x: 90, y: y },
            congestion: congestion,
          });
        }

        // Main roads (vertical)
        for (let i = 0; i < 3; i++) {
          const x = 20 + i * 30;
          const congestion = this.randomCongestion();
          roads.push({
            start: { x: x, y: 10 },
            end: { x: x, y: 90 },
            congestion: congestion,
          });
        }

        // Add some diagonal roads
        roads.push({
          start: { x: 20, y: 20 },
          end: { x: 80, y: 80 },
          congestion: this.randomCongestion(),
        });

        roads.push({
          start: { x: 20, y: 80 },
          end: { x: 80, y: 20 },
          congestion: this.randomCongestion(),
        });

        return {
          roads: roads,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error generating traffic data:', error);
        return {
          roads: [],
          timestamp: new Date().toISOString(),
        };
      }
    },

    /**
     * Generate a random congestion level
     * @returns {string} - Congestion level
     */
    randomCongestion() {
      const rand = Math.random();
      if (rand < 0.3) return 'low';
      if (rand < 0.7) return 'medium';
      return 'high';
    },
  };

  return {
    pollution,
    sunshine,
    weather,
    traffic,
  };
})();
