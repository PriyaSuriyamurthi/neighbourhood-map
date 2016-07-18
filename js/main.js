
function model() {

};

var ViewModel = function() {
      var self = this;
      var map;
      // Create a new blank array for all the listing markers.
      var markers = [];
        var currentLocation="Austin";
      self.currentLocation = ko.observable(currentLocation);
      var url="https://api.foursquare.com/v2/venues/search?client_id=QRFWJTS1ITKK3SGV3C3YMHOPY2OGYJWKVKKLLP5SZKLXPBSM&client_secret=XM0IRYFCUVW4WENIKHR111BGJ2AFWLYCGGD2ZT4I211TPZZJ&v=20130815&ll=40.7,-74&limit=15"
      var prev_infowindow =false;       
       
      function  initializeMap() {
        // Create a styles array to use with the map.
        var styles = [{"featureType":"landscape","stylers":[{"hue":"#FFBB00"},{"saturation":43.400000000000006},{"lightness":37.599999999999994},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#FFC200"},{"saturation":-61.8},{"lightness":45.599999999999994},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#FF0300"},{"saturation":-100},{"lightness":51.19999999999999},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#FF0300"},{"saturation":-100},{"lightness":52},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#0078FF"},{"saturation":-13.200000000000003},{"lightness":2.4000000000000057},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#00FF6A"},{"saturation":-1.0989010989011234},{"lightness":11.200000000000017},{"gamma":1}]}];
        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40.7413549, lng: -73.9980244},
          zoom: 13,
          styles: styles,
          mapTypeControl: false
        });
        var locations = [];
        var markerdetails;

        function listings() 
        {
      	var $fourSquareList = $('.fourSquareLoc');
      	var articlePhone;
      	$.getJSON(url,function(data)
      	{
      			
    		   articles = data.response.venues;
    		   for(var i=0;i <articles.length; i++)
           {
           var article = articles[i];
           articlePhone = ((typeof article.contact.formattedPhone === "undefined") ? " " : article.contact.formattedPhone);    
           $fourSquareList.append('<li class="article" >' + '<p>' + article.name + '</p>' + 
          	//'<p>' + article.categories[0].name + '</p>' + 
           '<p>' +article.location.formattedAddress + '</p>' + '<p>' + articlePhone + '</p>' +'</li><hr>');
           createLocation(article);
            }
          var bounds = new google.maps.LatLngBounds();
          for (var i = 0; i < markers.length; i++) 
          {
          	bounds.extend(markers[i].position);          
          }	
           	map.fitBounds(bounds);         
      	 });
      	}
      	listings();
      	function createLocation(venues) 
        {
      		var lat = venues.location.lat;
      		var lng = venues.location.lng;
      		var markerdetails = venues.name + ":" + venues.location.formattedAddress;
      		var location = new google.maps.LatLng(lat, lng);      	
          var largeInfowindow = new google.maps.InfoWindow();
            // Style the markers a bit. This will be our listing marker icon.
        	var defaultIcon = makeMarkerIcon('0091ff');
	        // Create a "highlighted location" marker color for when the user
	        // mouses over the marker.
        	var highlightedIcon = makeMarkerIcon('FFFF24');
        	// Get the position from the location array.
        	var position = location;
        	var title = markerdetails;
        	// Create a marker per location, and put into markers array.
        	var marker = new google.maps.Marker({
        	map: map,
          position: position,
          title: title,
          animation: google.maps.Animation.DROP            
        	});
        	markers.push(marker);
        	marker.addListener('click', function() { 
          populateInfoWindow(this, largeInfowindow);
          map.panTo(position);
       	  });
        	// Push the marker to our array of markers.
         	marker.addListener('mouseover', function() {
          this.setIcon(highlightedIcon);
        	});
        	marker.addListener('mouseout', function() {
          this.setIcon(defaultIcon);
          });
      }
    }
    initializeMap();
      // This function populates the infowindow when the marker is clicked. We'll only allow
      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
      function populateInfoWindow(marker, infowindow) {
       	if (prev_infowindow) {
           		prev_infowindow.close();
        	}
        	prev_infowindow = infowindow;
          console.log(prev_infowindow);
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          // Clear the infowindow content to give the streetview time to load.
          infowindow.setContent('');
          infowindow.marker = marker;
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
          var streetViewService = new google.maps.StreetViewService();
          var radius = 50;
          // In case the status is OK, which means the pano was found, compute the
          // position of the streetview image, then calculate the heading, then get a
          // panorama from that and set the options
          function getStreetView(data, status) {
          	 var markerTitleDetails = marker.title.split(":");
            if (status == google.maps.StreetViewStatus.OK) {
              var nearStreetViewLocation = data.location.latLng;
              
              var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
             
                infowindow.setContent('<div> <h4>' + markerTitleDetails[0] + '</h4><p>' + markerTitleDetails[1] + '</p></div><div id="pano"></div>');
                var panoramaOptions = {
                  position: nearStreetViewLocation,
                  pov: {
                    heading: heading,
                    pitch: 30
                  }
                };
              var panorama = new google.maps.StreetViewPanorama(
                $('.pano'), panoramaOptions);
            } 
            else {
            	
              	infowindow.setContent('<div> <h4>' + markerTitleDetails[0] + '</h4><p>' + markerTitleDetails[1] + '</p></div>' +
                '<div>No Street View Found</div>');    
                }
      	     }

          // Use streetview service to get the closest streetview image within
          // 50 meters of the markers position
          streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          // Open the infowindow on the correct marker.
          infowindow.open(map, marker);
          }
      }
   
      // This function takes in a COLOR, and then creates a new marker
      // icon of that color. The icon will be 21 px wide by 34 high, have an origin
      // of 0, 0 and be anchored at 10, 34).
      function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
      }
}
$(function() {
ko.applyBindings(new ViewModel());
});