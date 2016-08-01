var ViewModel = function() {
    var self = this;
    var map;
    var mapBounds;
    // Create a new blank array for all the listing markers.
    var markers = [];
    this.photoPlaceHolder = 'http://placehold.it/100x100';
    var updateMarker; 
    var infowindow;
    var currentLocation = "Austin";
    self.currentLocation = ko.observable(currentLocation);
    self.famousList = ko.observableArray([]);
    self.famousPicklist = ko.observableArray(self.famousList());
    var currLat;
    var currLng;
    var venuePhoto = [];
    var limit = "&limit=20&section=popularPicks";
    var clientId = "&client_id=QRFWJTS1ITKK3SGV3C3YMHOPY2OGYJWKVKKLLP5SZKLXPBSM&client_secret=XM0IRYFCUVW4WENIKHR111BGJ2AFWLYCGGD2ZT4I211TPZZJ&v=20160115";
    var isNavVisible = false;
    self.searchData = ko.observable("");
    function initializeMap() {
        // Create a styles array to use with the map.
        var styles = [{
            "featureType": "landscape",
            "stylers": [{
                "hue": "#FFA800"
            }, {
                "saturation": 0
            }, {
                "lightness": 0
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.highway",
            "stylers": [{
                "hue": "#53FF00"
            }, {
                "saturation": -73
            }, {
                "lightness": 40
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.arterial",
            "stylers": [{
                "hue": "#FBFF00"
            }, {
                "saturation": 0
            }, {
                "lightness": 0
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "road.local",
            "stylers": [{
                "hue": "#00FFFD"
            }, {
                "saturation": 0
            }, {
                "lightness": 30
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "water",
            "stylers": [{
                "hue": "#00BFFF"
            }, {
                "saturation": 6
            }, {
                "lightness": 8
            }, {
                "gamma": 1
            }]
        }, {
            "featureType": "poi",
            "stylers": [{
                "hue": "#679714"
            }, {
                "saturation": 33.4
            }, {
                "lightness": -25.4
            }, {
                "gamma": 1
            }]
        }];
        // Constructor creates a new map - only center and zoom are required. Style was added
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: currLat,
                lng: currLng
            },
            zoom: 13,
            styles: styles,
            mapTypeControl: false
        });
    }
    // make the popular place details invisible when width is less than 900 and show it only on click
    $('#pointerArrow').click(function() {
        if ($(window).width() < 900) {
            if (isNavVisible === false) {
                $('.fourSquareLoc').css('display', 'block');
                isNavVisible = true;
            } else {
                $('.fourSquareLoc').css('display', 'none');
                isNavVisible = false;
            }
        }
    });
    
    function popularList() {
        var locations = [];
        var markerdetails;
        var url;
        var popularurl;
        $.ajax({
            url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + currentLocation + "",
            type: "POST",
            success: function(res) {
                currLat = res.results[0].geometry.location.lat;
                currLng = res.results[0].geometry.location.lng;
                var baseLocation = currLat + "," + currLng;
                popularurl = "https://api.foursquare.com/v2/venues/explore?ll=" + baseLocation + clientId + limit;
                initializeMap();
                listings();
            }
        });

        // Four Square API is used to fetch the popular places for a goven location
        function listings() {
            var $fourSquareList = $('.fourSquareLoc');
            $.ajax({
                url: popularurl,
                success: function(data) {
                    articles = data.response.groups[0].items;
                    for (var i = 0; i < articles.length; i++) {
                        var article = articles[i].venue;
                        var articletip = articles[i].tips[0];
                        setPhotImage(article, articletip);
                        createLocation(article);
                    }
                    bounds = data.response.suggestedBounds;
                    if (bounds !== undefined) {
                        mapBounds = new google.maps.LatLngBounds(
                            new google.maps.LatLng(bounds.sw.lat, bounds.sw.lng),
                            new google.maps.LatLng(bounds.ne.lat, bounds.ne.lng));
                        map.fitBounds(mapBounds);
                    }
                },
                error: function() {
                    $fourSquareList.append('<li class="article-error" >' + '<p>' + "Error while fetching the data. Please try again" + '</p>');
                }
            });
        }
        // Call a separate api to fetch the picture of the populare location
        function setPhotImage(article, articletip) {
            var placePic;
            var articlePhone;
            var pickList;
            var placeImage;
            var picURL = "https://api.foursquare.com/v2/venues/" + article.id + "/photos?" + clientId;
            var baseImgURL = 'https://irs3.4sqi.net/img/general/';
            $.ajax({
                url: picURL,
                success: function(data) {
                    placeImage = data.response.photos.items;
                    for (var i = 0; i < placeImage.length; i++) {
                        placePic = baseImgURL + "width150" + placeImage[i].suffix;
                    }
                    articlePhone = ((typeof article.contact.formattedPhone === "undefined") ? " " : article.contact.formattedPhone);
                    pickList = {
                        "popName": article.name,
                        "popAddr": article.location.formattedAddress,
                        "popPhone": articlePhone,
                        "popURL": article.url,
                        "popCategory": article.categories[0].name,
                        "popTips": articletip.text,
                        "popImg": placePic
                    };
                    self.famousList.push(pickList);

                },
                error: function() {
                    placePic = this.photoPlaceHolder;
                }
            });
        }
        // Fetch the details of the popular places and set the marker
        function createLocation(venues) {
            var lat = venues.location.lat;
            var lng = venues.location.lng;
            var markerdetails = venues.name + ":" + venues.location.formattedAddress;
            var location = new google.maps.LatLng(lat, lng);
            infowindow = new google.maps.InfoWindow();
            // Style the markers a bit. This will be our listing marker icon.
            var defaultIcon = makeMarkerIcon('0091ff');
            // Create a "highlighted location" marker color for when the user
            // mouses over the marker.
            var highlightedIcon = makeMarkerIcon('FFFF24');
            // Get the position from the location array.
            var position = location;
            var title = markerdetails;
            var rating = venues.rating;
            var ratingMul = rating / 2;
            var ratingImg;
            var placePic;
            // Based on the rating, choose the right stars
            switch (true) {
                case (ratingMul >= 2.5 && ratingMul < 3):
                    ratingImg = "images/stars_2.5.png";
                    break;
                case (ratingMul >= 3 && ratingMul < 3.5):
                    ratingImg = "images/stars_3.png";
                    break;
                case (ratingMul >= 3.5 && ratingMul < 4):
                    ratingImg = "images/stars_3.5.png";
                    break;
                case (ratingMul >= 4 && ratingMul < 4.5):
                    ratingImg = "images/stars_4.png";
                    break;
                case (ratingMul >= 4.5 && ratingMul < 5):
                    ratingImg = "images/stars_4.5.png";
                    break;
                case (ratingMul == 5):
                    ratingImg = "images/stars_5.png";
            }
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                map: map,
                position: position,
                title: title,
                rating: rating,
                animation: google.maps.Animation.DROP
            });
            markers.push(marker);
            // Personalized the info window when the marker is clicked
            marker.addListener('click', function() {
                var markerTitleDetails = marker.title.split(":");
                var PicId = marker.id;
                infowindow.setContent('<div class="infoDetails"> <h4 class="infoHeader">' +
                    markerTitleDetails[0] + '</h4>' +
                    '<p>' + markerTitleDetails[1] + '</p>' +
                    '<div class="infoPara"> <img src="' + ratingImg +
                    '" class="img-responsive rateImg"><p class="rateNum">' +
                    ratingMul + '</p>' +
                    '</div></div>');
                infowindow.open(map, marker);
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
    popularList();
    // clear the marker and remove the famous place list when the location is changed from default
    function clearMarker() {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
        self.famousList.removeAll();
        updateMarker.length = 0;
    }
    // alter the center when there is a resize
    window.addEventListener('resize', function(e) {

        map.fitBounds(mapBounds);
        map.setCenter(map.center);
        $('#map').height($(window).height());
    });
    // when on search for a specific location, change the marker details shown on the map
    function changeMarkers() {
        var searchOutList = self.famousList();
        var assignNull;

        for (var i = 0; i < updateMarker.length; i++) {
            assignNull = true;
            for (var j = 0; j < searchOutList.length; j++) {
                if (updateMarker[i].title.split(":")[0] === searchOutList[j].popName) {
                    assignNull = false;
                }
            }
            if (assignNull === true) {
                updateMarker[i].setMap(null);
            } else {
                updateMarker[i].setMap(map);
            }
        }
    }

    self.changeLocation = function() {
        currentLocation = self.currentLocation();
        clearMarker();
        popularList();
    };
    self.showInfo = function(clickList) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].title.split(":")[0] === clickList.popName) {
                google.maps.event.trigger(markers[i], 'click');
                map.panTo(markers[i].position);
            }
        }

    };
    self.searchList = function() {
        var keyword = self.searchData().toLowerCase();
        var currentList = self.famousPicklist();
        var searchMarker = [];
        updateMarker = markers;
        if (keyword !== "") {
            for (var i = 0; i < currentList.length; i++) {
                if ((currentList[i].popName.toLowerCase().indexOf(keyword)) !== -1) {
                    searchMarker.push(currentList[i]);
                }
            }
            self.famousList(searchMarker);
        } else {
            self.famousList(currentList);
        }
        changeMarkers();
    };
    // This function takes in a COLOR, and then creates a new marker
    // icon of that color. The icon will be 21 px wide by 34 high, have an origin
    // of 0, 0 and be anchored at 10, 34).

    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
            return markerImage;
    }

};
$(function() {
    ko.applyBindings(new ViewModel());
});