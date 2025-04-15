document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = L.map('map').setView([40.7128, -74.0060], 11); // Default to NYC
    
    // Add dark-themed map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // References to DOM elements
    const radiusInput = document.getElementById('radius-input');
    const radiusValue = document.getElementById('radius-value');
    const useLocationBtn = document.getElementById('btn-use-location');
    const addressInput = document.getElementById('address-input');
    const searchAddressBtn = document.getElementById('btn-search-address');
    const centersContainer = document.getElementById('centers-container');
    const centersList = document.getElementById('center-list');
    const noCentersMessage = document.getElementById('no-centers-message');
    const locationError = document.getElementById('location-error');
    const selectedCenterDetails = document.getElementById('selected-center-details');
    
    // Map state
    let userLocation = null;
    let markers = [];
    let centers = [];
    let searchRadius = parseInt(radiusInput.value);
    
    // Center details elements
    const centerDetailName = document.getElementById('center-detail-name');
    const centerDetailAddress = document.getElementById('center-detail-address');
    const centerDetailPhone = document.getElementById('center-detail-phone');
    const centerDetailWebsite = document.getElementById('center-detail-website');
    const centerDetailHours = document.getElementById('center-detail-hours');
    const centerDetailMaterials = document.getElementById('center-detail-materials');
    const centerDetailDistance = document.getElementById('center-detail-distance');
    const centerDetailDirections = document.getElementById('center-detail-directions');
    const centerDetailShare = document.getElementById('center-detail-share');
    
    // Update radius value display
    radiusInput.addEventListener('input', function() {
        searchRadius = parseInt(this.value);
        radiusValue.textContent = `${searchRadius} km`;
        
        // If we have user location, update the search
        if (userLocation) {
            searchCenters(userLocation.lat, userLocation.lng, searchRadius);
        }
    });
    
    // Use browser geolocation
    useLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            useLocationBtn.disabled = true;
            useLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Getting location...';
            
            navigator.geolocation.getCurrentPosition(
                // Success callback
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    userLocation = { lat, lng };
                    
                    // Center the map on user location
                    map.setView([lat, lng], 11);
                    
                    // Add a marker for user location
                    addUserLocationMarker(lat, lng);
                    
                    // Search for recycling centers
                    searchCenters(lat, lng, searchRadius);
                    
                    // Reset button
                    useLocationBtn.disabled = false;
                    useLocationBtn.innerHTML = '<i class="fas fa-location-arrow me-2"></i> Use My Location';
                    
                    // Hide any error messages
                    locationError.classList.add('d-none');
                },
                // Error callback
                function(error) {
                    console.error('Geolocation error:', error);
                    useLocationBtn.disabled = false;
                    useLocationBtn.innerHTML = '<i class="fas fa-location-arrow me-2"></i> Use My Location';
                    
                    // Show error message
                    locationError.classList.remove('d-none');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
            locationError.classList.remove('d-none');
        }
    });
    
    // Search by address
    searchAddressBtn.addEventListener('click', function() {
        const address = addressInput.value.trim();
        if (address) {
            // In a real application, we would use a geocoding service like MapBox, Google Maps, or Nominatim
            // For this simulation, we'll use random coordinates near NYC
            simulateGeocoding(address);
        }
    });
    
    // Allow pressing Enter in the address input
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchAddressBtn.click();
        }
    });
    
    // Add user location marker
    function addUserLocationMarker(lat, lng) {
        // Clear existing user marker
        markers.forEach(marker => {
            if (marker.isUserLocation) {
                map.removeLayer(marker);
            }
        });
        
        // Create a custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-map-marker-alt fa-2x text-primary"></i>',
            iconSize: [25, 25],
            iconAnchor: [12, 25]
        });
        
        // Add marker
        const marker = L.marker([lat, lng], {
            icon: userIcon,
            zIndexOffset: 1000 // Ensure it's on top
        }).addTo(map);
        marker.isUserLocation = true;
        
        // Add a circle to show the search radius
        const radiusCircle = L.circle([lat, lng], {
            radius: searchRadius * 1000, // Convert km to meters
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);
        
        // Add to markers array
        markers.push(marker);
        markers.push(radiusCircle);
    }
    
    // Simulate geocoding (in a real app, this would call a geocoding service)
    function simulateGeocoding(address) {
        // Disable the button during "processing"
        searchAddressBtn.disabled = true;
        searchAddressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Simulate network delay
        setTimeout(() => {
            // Generate random coordinates near NYC
            const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
            const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
            
            userLocation = { lat, lng };
            
            // Center the map
            map.setView([lat, lng], 11);
            
            // Add a marker
            addUserLocationMarker(lat, lng);
            
            // Search for centers
            searchCenters(lat, lng, searchRadius);
            
            // Reset button
            searchAddressBtn.disabled = false;
            searchAddressBtn.innerHTML = '<i class="fas fa-search"></i>';
            
            // Hide error message
            locationError.classList.add('d-none');
        }, 1000);
    }
    
    // Search for recycling centers
    function searchCenters(lat, lng, radius) {
        // Show loading state
        centersList.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>Searching for recycling centers...</p>
            </div>
        `;
        centersContainer.classList.remove('d-none');
        noCentersMessage.classList.add('d-none');
        
        // In a real application, this would be an API call to the backend
        fetch('/api/recycling-centers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                radius: radius
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                centers = data.centers;
                
                // Display the centers
                displayCenters(centers);
                
                // Add markers to the map
                addCenterMarkers(centers);
                
                // Show/hide appropriate elements
                centersContainer.classList.remove('d-none');
                if (centers.length === 0) {
                    noCentersMessage.classList.remove('d-none');
                } else {
                    noCentersMessage.classList.add('d-none');
                }
            } else {
                throw new Error(data.error || 'Failed to find recycling centers');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            centersList.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error: ${error.message}
                </div>
            `;
        });
    }
    
    // Display centers in the list
    function displayCenters(centers) {
        if (centers.length === 0) {
            centersList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-search me-2"></i>
                    No recycling centers found within ${searchRadius}km.
                </div>
            `;
            return;
        }
        
        let html = '';
        centers.forEach((center, index) => {
            html += `
                <div class="list-group-item center-card p-3" data-center-id="${center.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">${center.name}</h5>
                            <p class="mb-1 text-muted">${center.address}</p>
                        </div>
                        <span class="badge bg-primary rounded-pill">${center.distance} km</span>
                    </div>
                    <div class="mt-2">
                        <small class="d-block mb-1">
                            <i class="fas fa-recycle me-1"></i> ${center.materials_accepted}
                        </small>
                        <small class="d-block text-muted">
                            <i class="fas fa-clock me-1"></i> ${center.hours}
                        </small>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary view-details-btn" data-center-index="${index}">
                            <i class="fas fa-info-circle me-1"></i> Details
                        </button>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}" 
                           target="_blank" class="btn btn-sm btn-outline-success ms-2">
                            <i class="fas fa-directions me-1"></i> Directions
                        </a>
                    </div>
                </div>
            `;
        });
        
        centersList.innerHTML = html;
        
        // Add event listeners to the detail buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const centerIndex = parseInt(this.getAttribute('data-center-index'));
                showCenterDetails(centers[centerIndex]);
                
                // Add active class to the selected center card
                document.querySelectorAll('.center-card').forEach(card => {
                    card.classList.remove('active');
                });
                this.closest('.center-card').classList.add('active');
            });
        });
    }
    
    // Add markers for recycling centers
    function addCenterMarkers(centers) {
        // Remove existing center markers
        markers.forEach(marker => {
            if (!marker.isUserLocation) {
                map.removeLayer(marker);
            }
        });
        
        // Filter out non-center markers
        markers = markers.filter(marker => marker.isUserLocation);
        
        // Add new markers
        centers.forEach((center, index) => {
            // Create a custom icon for recycling centers
            const centerIcon = L.divIcon({
                className: 'center-marker',
                html: `<i class="fas fa-recycle fa-lg text-success"></i>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            // Add marker
            const marker = L.marker([center.latitude, center.longitude], {
                icon: centerIcon
            }).addTo(map);
            
            // Add popup
            marker.bindPopup(`
                <div>
                    <h6>${center.name}</h6>
                    <p class="mb-1">${center.address}</p>
                    <p class="mb-1"><small>${center.distance} km away</small></p>
                    <button class="btn btn-sm btn-primary mt-2 center-details-btn" data-center-index="${index}">
                        Details
                    </button>
                </div>
            `);
            
            // Event listener for popup content
            marker.on('popupopen', function() {
                document.querySelectorAll('.center-details-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const centerIndex = parseInt(this.getAttribute('data-center-index'));
                        showCenterDetails(centers[centerIndex]);
                        
                        // Add active class to the corresponding list item
                        document.querySelectorAll('.center-card').forEach(card => {
                            card.classList.remove('active');
                            if (card.getAttribute('data-center-id') == centers[centerIndex].id) {
                                card.classList.add('active');
                                // Scroll to the card in the list
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        });
                    });
                });
            });
            
            // Add to markers array
            markers.push(marker);
        });
        
        // If there are centers, adjust the map to show all markers
        if (centers.length > 0) {
            // Create a bounds object
            const bounds = L.latLngBounds();
            
            // Add all markers to the bounds
            markers.forEach(marker => {
                if (marker.getLatLng) {  // Make sure it's a marker, not a circle
                    bounds.extend(marker.getLatLng());
                }
            });
            
            // Fit the map to the bounds with some padding
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    // Show detailed information for a selected center
    function showCenterDetails(center) {
        // Update the details panel
        centerDetailName.textContent = center.name;
        centerDetailAddress.innerHTML = `
            <i class="fas fa-map-marker-alt me-2"></i> ${center.address}<br>
            <i class="fas fa-phone me-2"></i> <span id="center-detail-phone">${center.phone || 'Not available'}</span><br>
            <i class="fas fa-globe me-2"></i> <a id="center-detail-website" href="${center.website || '#'}" target="_blank">${center.website || 'Not available'}</a>
        `;
        centerDetailHours.textContent = center.hours || 'Not specified';
        centerDetailMaterials.textContent = center.materials_accepted || 'Contact center for details';
        centerDetailDistance.textContent = `${center.distance} km from your location`;
        
        // Update the directions link
        centerDetailDirections.href = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
        
        // Update the share link (simplified)
        centerDetailShare.href = `mailto:?subject=E-Waste%20Recycling%20Center&body=Check%20out%20this%20recycling%20center:%0A%0A${center.name}%0A${center.address}%0A${center.phone || ''}%0A${center.website || ''}`;
        
        // Show the details panel
        selectedCenterDetails.classList.remove('d-none');
        
        // Scroll to the details
        selectedCenterDetails.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Initialize the map with a default view
    // This would typically show a national or regional view before the user selects a location
    function initializeMap() {
        // Add a welcoming message or instructions overlay on the map
        const mapOverlay = L.control({ position: 'center' });
        mapOverlay.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'map-overlay');
            div.innerHTML = `
                <div class="text-center p-3 bg-dark bg-opacity-75 rounded text-white">
                    <i class="fas fa-map-marked-alt fa-2x mb-2"></i>
                    <h4>Find Recycling Centers Near You</h4>
                    <p>Use the search tools to locate e-waste recycling centers in your area.</p>
                </div>
            `;
            return div;
        };
        // We would add this overlay in a real implementation
        // For this simulation, we'll leave it out
    }
    
    // Initialize the map
    initializeMap();
});
