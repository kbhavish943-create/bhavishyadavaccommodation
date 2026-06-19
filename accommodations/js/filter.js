// Accommodation Listing - Filtering and Display Logic

class AccommodationFilter {
  constructor() {
    this.accommodationData = null;
    this.selectedState = null;
    this.selectedCity = null;
    this.init();
  }

  async init() {
    try {
      // Load accommodation data
      const response = await fetch('./data/accommodations.json');
      this.accommodationData = await response.json();
      
      // Initialize dropdowns
      this.populateStateDropdown();
      this.setupEventListeners();
      
      // Display featured lodges initially
      this.displayFeaturedLodges();
    } catch (error) {
      console.error('Error loading accommodation data:', error);
      this.showError('Failed to load accommodation data');
    }
  }

  setupEventListeners() {
    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');

    stateSelect.addEventListener('change', (e) => {
      this.onStateChange(e.target.value);
    });

    citySelect.addEventListener('change', (e) => {
      this.onCityChange(e.target.value);
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterBySearch(e.target.value);
      });
    }
  }

  populateStateDropdown() {
    const stateSelect = document.getElementById('stateSelect');
    const states = this.accommodationData.states;

    states.forEach(state => {
      const option = document.createElement('option');
      option.value = state.stateId;
      option.textContent = state.stateName;
      stateSelect.appendChild(option);
    });
  }

  onStateChange(stateId) {
    this.selectedState = stateId;
    this.selectedCity = null;
    
    // Reset and update city dropdown
    const citySelect = document.getElementById('citySelect');
    citySelect.innerHTML = '<option value="">Select City</option>';
    citySelect.disabled = true;

    if (!stateId) {
      this.displayFeaturedLodges();
      return;
    }

    const state = this.accommodationData.states.find(s => s.stateId === stateId);
    
    if (state && state.cities.length > 0) {
      state.cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.cityId;
        option.textContent = city.cityName;
        citySelect.appendChild(option);
      });
      citySelect.disabled = false;
    }

    this.clearLodgeDisplay();
  }

  onCityChange(cityId) {
    this.selectedCity = cityId;

    if (!this.selectedState || !cityId) {
      this.clearLodgeDisplay();
      return;
    }

    const state = this.accommodationData.states.find(s => s.stateId === this.selectedState);
    const city = state.cities.find(c => c.cityId === cityId);

    if (city) {
      this.displayLodges(city.lodges, city.cityName);
    }
  }

  displayLodges(lodges, cityName) {
    const container = document.getElementById('lodgesContainer');
    container.innerHTML = '';

    if (lodges.length === 0) {
      container.innerHTML = `
        <div class="no-lodges">
          <p>📍 No lodges available in ${cityName}</p>
          <p>Check other cities or check back soon!</p>
        </div>
      `;
      return;
    }

    lodges.forEach(lodge => {
      const lodgeCard = this.createLodgeCard(lodge);
      container.appendChild(lodgeCard);
    });

    // Update stats
    this.updateStats(lodges.length, cityName);
  }

  displayFeaturedLodges() {
    const container = document.getElementById('lodgesContainer');
    container.innerHTML = '<h3 class="section-title">Featured Accommodations</h3>';

    const featuredLodges = [];
    this.accommodationData.states.forEach(state => {
      state.cities.forEach(city => {
        city.lodges.forEach(lodge => {
          if (lodge.featured) {
            featuredLodges.push({ ...lodge, city: city.cityName, state: state.stateName });
          }
        });
      });
    });

    if (featuredLodges.length === 0) {
      container.innerHTML += '<p>No featured accommodations available</p>';
      return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'lodges-grid';

    featuredLodges.forEach(lodge => {
      const lodgeCard = this.createLodgeCard(lodge);
      gridContainer.appendChild(lodgeCard);
    });

    container.appendChild(gridContainer);
  }

  createLodgeCard(lodge) {
    const card = document.createElement('div');
    card.className = 'lodge-card';

    // Get available room types
    const availableRooms = lodge.roomTypes.filter(r => r.availability);
    const minPrice = availableRooms.length > 0 
      ? Math.min(...availableRooms.map(r => r.price))
      : lodge.roomTypes[0].price;
    const maxPrice = Math.max(...lodge.roomTypes.map(r => r.price));

    // Star rating
    const starHTML = this.createStarRating(lodge.rating);

    // Amenities badges
    const amenitiesHTML = lodge.amenities.slice(0, 3).map(a => `<span class="amenity-badge">${a}</span>`).join('');

    card.innerHTML = `
      <div class="lodge-header">
        <img src="${lodge.imageUrl}" alt="${lodge.name}" class="lodge-image">
        ${lodge.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
      </div>

      <div class="lodge-body">
        <h3 class="lodge-name">${lodge.name}</h3>
        
        <div class="lodge-rating">
          ${starHTML}
          <span class="rating-score">${lodge.rating}</span>
          <span class="review-count">(${lodge.reviews} reviews)</span>
        </div>

        <div class="lodge-info">
          <p class="info-item">
            <span class="icon">📍</span>
            <span>${lodge.location}</span>
          </p>
          <p class="info-item">
            <span class="icon">📏</span>
            <span>${lodge.distanceFromCoaching} from coaching</span>
          </p>
          <p class="info-item">
            <span class="icon">💰</span>
            <span>₹${minPrice} - ₹${maxPrice}/month</span>
          </p>
        </div>

        <div class="amenities">
          ${amenitiesHTML}
          ${lodge.amenities.length > 3 ? `<span class="amenity-badge">+${lodge.amenities.length - 3} more</span>` : ''}
        </div>

        <div class="room-types-summary">
          <strong>Available Rooms:</strong>
          <div class="room-badges">
            ${availableRooms.map(r => `<span class="room-badge">${r.type}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="lodge-footer">
        <button class="btn btn-primary btn-view-details">View Details</button>
        <button class="btn btn-secondary btn-contact-now">Contact Now</button>
      </div>
    `;

    const viewButton = card.querySelector('.btn-view-details');
    if (viewButton) {
      viewButton.addEventListener('click', () => viewDetails(lodge.id));
    }

    const contactButton = card.querySelector('.btn-contact-now');
    if (contactButton) {
      contactButton.addEventListener('click', () => {
        contactLodge(lodge.name, lodge.phoneNumber, lodge.email);
      });
    }

    return card;
  }

  createStarRating(rating) {
    const stars = Math.round(rating);
    let starHTML = '';
    for (let i = 0; i < 5; i++) {
      starHTML += i < stars ? '⭐' : '☆';
    }
    return starHTML;
  }

  filterBySearch(searchTerm) {
    const container = document.getElementById('lodgesContainer');
    const cards = container.querySelectorAll('.lodge-card');

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const matches = text.includes(searchTerm.toLowerCase());
      card.style.display = matches ? 'block' : 'none';
    });
  }

  updateStats(count, cityName) {
    const statsDiv = document.getElementById('lodgeStats');
    if (statsDiv) {
      statsDiv.innerHTML = `<p>📊 Found <strong>${count}</strong> accommodation(s) in <strong>${cityName}</strong></p>`;
    }
  }

  clearLodgeDisplay() {
    const container = document.getElementById('lodgesContainer');
    container.innerHTML = '<p class="placeholder">Select a city to view accommodations</p>';
    
    const statsDiv = document.getElementById('lodgeStats');
    if (statsDiv) statsDiv.innerHTML = '';
  }

  showError(message) {
    const container = document.getElementById('lodgesContainer');
    container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
  }
}

// Global functions for button actions
function viewDetails(lodgeId) {
  // Open detailed view or modal
  alert(`Viewing details for lodge ID: ${lodgeId}`);
  // TODO: Implement detailed view modal
}

function contactLodge(name, phone, email) {
  const message = `Contact ${name}\nPhone: ${phone}\nEmail: ${email}`;
  alert(message);
  // TODO: Implement contact form
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccommodationFilter();
});
