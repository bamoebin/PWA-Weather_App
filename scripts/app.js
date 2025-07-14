'use strict';

// Add after existing code
let deferredPrompt; // Store the install prompt
let installButton;

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('👀 Install prompt available');
  
  // Prevent the default mini-infobar from appearing
  e.preventDefault();
  
  // Store the event for later use
  deferredPrompt = e;
  
  // Show custom install button
  showInstallButton();
});

// Show custom install UI
function showInstallButton() {
  // Create custom install button
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.className = 'install-button';
    installButton.style.cssText = `
      position: fixed;
      top: 70px;
      right: 16px;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1001;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    installButton.addEventListener('click', installApp);
    document.body.appendChild(installButton);
  }
  
  installButton.style.display = 'block';
}

// Handle install button click
async function installApp() {
  if (!deferredPrompt) {
    console.log('❌ No install prompt available');
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('🎉 User accepted the install');
    hideInstallButton();
  } else {
    console.log('😔 User dismissed the install');
  }
  
  // Reset the deferred prompt
  deferredPrompt = null;
}

// Hide install button
function hideInstallButton() {
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Listen for successful install
window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 PWA was installed successfully!');
  hideInstallButton();
  
  // Optional: Show thank you message
  showNotification('App installed! You can now use it offline.');
});

// Check if app is already installed
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
}

// Helper function for notifications
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: #323232;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 1002;
    animation: slideDown 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize install features
function initInstallFeatures() {
  // Hide install button if app already installed
  if (isAppInstalled()) {
    console.log('📱 App is already installed');
    hideInstallButton();
  }
}

// Register Service Worker dengan error handling yang lebih baik
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')  // ← Pastikan path benar
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 New version available! Refresh to update.');
              } else {
                console.log('📱 App is ready for offline use!');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
        console.log('💡 Make sure sw.js file exists in the root directory');
      });
  });
} else {
  console.log('❌ Service Worker not supported in this browser');
}

function showUpdateAvailable() {
  // Show notification that update is available
  console.log('New version available! Refresh to update.');
  // You can show a notification to user here
}

function showInstallSuccess() {
  console.log('App is ready for offline use!');
}

const weatherApp = {
  selectedLocations: {},
  addDialogContainer: document.getElementById('addDialogContainer'),
};

/**
 * Generate mock weather data for testing
 */
function generateMockWeatherData(cityName) {
  const currentTime = Math.floor(Date.now() / 1000);
  return {
    currently: {
      time: currentTime,
      summary: "Partly Cloudy",
      icon: "partly-cloudy-day",
      temperature: 25 + Math.random() * 10,
      humidity: 0.6 + Math.random() * 0.3,
      windSpeed: 5 + Math.random() * 15,
      windBearing: Math.floor(Math.random() * 360)
    },
    timezone: "Asia/Jakarta",
    daily: {
      data: Array.from({length: 8}, (_, i) => ({
        time: currentTime + (i * 24 * 60 * 60),
        sunriseTime: currentTime + (6 * 60 * 60),
        sunsetTime: currentTime + (18 * 60 * 60),
        icon: ["clear-day", "partly-cloudy-day", "cloudy", "rain"][Math.floor(Math.random() * 4)],
        temperatureHigh: 28 + Math.random() * 8,
        temperatureLow: 18 + Math.random() * 8
      }))
    }
  };
}

/**
 * Get's the latest forecast data from the network.
 * Currently using mock data for development
 */
function getForecastFromNetwork(coords) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const mockData = generateMockWeatherData('Mock City');
      resolve(mockData);
    }, 1000);
  });
}

/**
 * Toggles the visibility of the add location dialog box.
 */
function toggleAddDialog() {
  weatherApp.addDialogContainer.classList.toggle('visible');
}

/**
 * Event handler for butDialogAdd, adds the selected location to the list.
 */
function addLocation() {
  // Hide the dialog
  toggleAddDialog();
  // Get the selected city
  const select = document.getElementById('selectCityToAdd');
  const selected = select.options[select.selectedIndex];
  const geo = selected.value;
  const label = selected.textContent;
  const location = {label: label, geo: geo};
  // Create a new card & get the weather data from the server
  const card = getForecastCard(location);
  
  // For now, use mock data since API is not implemented
  const mockForecast = generateMockWeatherData(label);
  renderForecast(card, mockForecast);
  
  // Save the updated list of selected cities.
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);
}

/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function removeLocation(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.selectedLocations[parent.id]) {
    delete weatherApp.selectedLocations[parent.id];
    saveLocationList(weatherApp.selectedLocations);
  }
}

/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with.
 */
function renderForecast(card, data) {
  if (!data) {
    // There's no data, skip the update.
    return;
  }

  // Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector('.card-last-updated');
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If the data on the element is newer, skip the update.
  if (lastUpdated >= data.currently.time) {
    return;
  }
  cardLastUpdatedElem.textContent = data.currently.time;

  // Render the forecast data into the card.
  card.querySelector('.description').textContent = data.currently.summary;
  const forecastFrom = luxon.DateTime
      .fromSeconds(data.currently.time)
      .setZone(data.timezone)
      .toFormat('DDDD t');
  card.querySelector('.date').textContent = forecastFrom;
  card.querySelector('.current .icon')
      .className = `icon ${data.currently.icon}`;
  card.querySelector('.current .temperature .value')
      .textContent = Math.round(data.currently.temperature);
  card.querySelector('.current .humidity .value')
      .textContent = Math.round(data.currently.humidity * 100);
  card.querySelector('.current .wind .value')
      .textContent = Math.round(data.currently.windSpeed);
  card.querySelector('.current .wind .direction')
      .textContent = Math.round(data.currently.windBearing);
  const sunrise = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunriseTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunrise .value').textContent = sunrise;
  const sunset = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunsetTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunset .value').textContent = sunset;

  // Render the next 7 days.
  const futureTiles = card.querySelectorAll('.future .oneday');
  futureTiles.forEach((tile, index) => {
    const forecast = data.daily.data[index + 1];
    const forecastFor = luxon.DateTime
        .fromSeconds(forecast.time)
        .setZone(data.timezone)
        .toFormat('ccc');
    tile.querySelector('.date').textContent = forecastFor;
    tile.querySelector('.icon').className = `icon ${forecast.icon}`;
    tile.querySelector('.temp-high .value')
        .textContent = Math.round(forecast.temperatureHigh);
    tile.querySelector('.temp-low .value')
        .textContent = Math.round(forecast.temperatureLow);
  });

  // If the loading spinner is still visible, remove it.
  const spinner = card.querySelector('.card-spinner');
  if (spinner) {
    card.removeChild(spinner);
  }
}

/**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
// function getForecastFromNetwork(coords) {
//   return fetch(`/forecast/${coords}`)
//       .then((response) => {
//         return response.json();
//       })
//       .catch(() => {
//         return null;
//       });
// }

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromCache(coords) {
  // KodePWA: Add code to get weather forecast from the caches object.
  return null; // Placeholder for cache retrieval logic
}

/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getForecastCard(location) {
  const id = location.geo;
  const card = document.getElementById(id);
  if (card) {
    return card;
  }
  const newCard = document.getElementById('weather-template').cloneNode(true);
  newCard.querySelector('.location').textContent = location.label;
  newCard.setAttribute('id', id);
  newCard.querySelector('.remove-city')
      .addEventListener('click', removeLocation);
  document.querySelector('main').appendChild(newCard);
  newCard.removeAttribute('hidden');
  return newCard;
}

/**
 * Gets the latest weather forecast data and updates each card with the
 * new data.
 */
function updateData() {
  Object.keys(weatherApp.selectedLocations).forEach((key) => {
    const location = weatherApp.selectedLocations[key];
    const card = getForecastCard(location);
    
    // Use mock data for now
    const mockForecast = generateMockWeatherData(location.label);
    renderForecast(card, mockForecast);
  });
}

/**
 * Saves the list of locations.
 *
 * @param {Object} locations The list of locations to save.
 */
function saveLocationList(locations) {
  const data = JSON.stringify(locations);
  localStorage.setItem('locationList', data);
}

/**
 * Load default location data
 */
function loadLocationList() {
  let locations = localStorage.getItem('locationList');
  if (locations) {
    try {
      locations = JSON.parse(locations);
    } catch (ex) {
      locations = {};
    }
  }
  if (!locations || Object.keys(locations).length === 0) {
    const key = '-5.7759362,106.1174957'; // Jakarta coordinates
    locations = {};
    locations[key] = {label: 'Jakarta, Indonesia', geo: key};
  }
  return locations;
}

/**
 * Initialize the app, gets the list of locations from local storage, then
 * renders the initial data.
 */
function init() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

function initApp() {
  // Initialize elements that require DOM
  weatherApp.addDialogContainer = document.getElementById('addDialogContainer');
  
  // Get the location list, and update the UI.
  weatherApp.selectedLocations = loadLocationList();
  updateData();

  // Set up the event handlers for all of the buttons.
  const butAdd = document.getElementById('butAdd');
  const butDialogCancel = document.getElementById('butDialogCancel');
  const butDialogAdd = document.getElementById('butDialogAdd');
  
  if (butAdd) {
    butAdd.addEventListener('click', toggleAddDialog);
  }
  if (butDialogCancel) {
    butDialogCancel.addEventListener('click', toggleAddDialog);
  }
  if (butDialogAdd) {
    butDialogAdd.addEventListener('click', addLocation);
  }

  // Initialize install features
  initInstallFeatures();
}

init();
