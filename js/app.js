var initialSpaces = [
  {
    "name" : "Puri sea beach",
    "location" : {"lat" : 19.79440639 ,"lng" : 85.82536697},
    "fs_id" : "4cfb649ac671721e4959c318"
  },
  {
    "name" : "Domino's pizza",
    "location" : {"lat" : 19.796774 ,"lng" : 85.826311},
    "fs_id" : "4d777cd9f2c05481cbcaa9a1"
  },
  {
    "name" : "chung wah",
    "location" : {"lat" : 19.8011383 ,"lng" : 85.8319102},
    "fs_id" : "506ac48be4b0677a1fd4f871"
  },
  {
    "name" : "Hotel holiday resort",
    "location" : {"lat" : 19.801556,"lng" : 85.8413047},
    "fs_id" : "4bd79337304fce728db733ab"
  }
]

// Foursquare API Url parameters in global scope
var BaseUrl = "https://api.foursquare.com/v2/venues/",
    fsClient_id = "client_id=RLBSLOXZA1YH3JMM2AUVAO3DBA5OP5KJ3QATT2FA4IZYEHDN",
    fsClient_secret = "&client_secret=KEOJFBPEQTVUI3LQUZWHESGQU5J0SME3PXA0UWKWJP0J1XYZ",
    fsVersion = "&v=20170928";


// Create global variables to use in google maps
var map,
  infowindow,
  bounds;

//googleSuccess() is called when page is loaded
function mapLoad() {
  "use strict";
  //Google map elements - set map options
  var mapOptions = {
    "center": {
      "lat": 19.817743,
      "lng": 85.828629
    },
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    }
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  infowindow = new google.maps.InfoWindow({
    maxWidth: 150,
    content: ""
  });
  bounds = new google.maps.LatLngBounds();

  // Close infowindow when clicked elsewhere on the map
  map.addListener("click", function(){
    infowindow.close(infowindow);
  });

  // Recenter map upon window resize
  window.onresize = function () {
    map.fitBounds(bounds);
  };


  //Creating Space object
  var Space = function (data, id, map) {
    var self = this;
    this.name = ko.observable(data.name);
    this.location = data.location;
    this.marker = "";
    this.markerId = id;
    this.fs_id = data.fs_id;
    this.shortUrl = "";
    this.photoUrl = "";
  }

  // Get contect infowindows
  function getContent(space) {
    var contentString = "<h3>" + space.name +
      "</h3><br><div style='width:200px;min-height:120px'><img src=" + '"' +
      space.photoUrl + '"></div><div><a href="' + space.shortUrl +
      '" target="_blank">More info in Foursquare</a><img src="img/foursquare_150.png">';
    var errorString = "Oops, Foursquare content not available."
    if (space.name.length > 0) {
      return contentString;
      } else {
      return errorString;
      }
  }

  // Bounce effect on marker
  function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 700);
    }
  };

 function ViewModel() {
    var self = this;

    // Nav button control
    this.isNavClosed = ko.observable(false);
    this.navClick = function () {
      this.isNavClosed(!this.isNavClosed());
    };

    // Creating list elements from the spaceList
    this.spaceList = ko.observableArray();
    initialSpaces.forEach(function(item){
      self.spaceList.push(new Space(item));
    });

    // Create a marker per space item
    this.spaceList().forEach(function(space) {
      var marker = new google.maps.Marker({
        map: map,
        position: space.location,
        animation: google.maps.Animation.DROP
      });
      space.marker = marker;
      // Extend the boundaries of the map for each marker
      bounds.extend(marker.position);
      // Create an onclick event to open an infowindow and bounce the marker at each marker
      marker.addListener("click", function(e) {
        map.panTo(this.position);
        //pan down infowindow by 200px to keep whole infowindow on screen
        map.panBy(0, -200)
        infowindow.setContent(getContent(space));
        infowindow.open(map, marker);
        toggleBounce(marker);
    });
  });

    // Foursquare API request
    self.getFoursquareData = ko.computed(function(){
      self.spaceList().forEach(function(space) {

        // Set initail variables to build the correct URL for each space
        var  venueId = space.fs_id + "/?";
        var foursquareUrl = BaseUrl + venueId + fsClient_id + fsClient_secret + fsVersion;

        // AJAX call to Foursquare
        $.ajax({
          type: "GET",
          url: foursquareUrl,
          dataType: "json",
          cache: false,
          success: function(data) {
            var response = data.response ? data.response : "";
            var venue = response.venue ? data.venue : "";
                space.name = response.venue["name"];
                space.shortUrl = response.venue["shortUrl"];
                space.photoUrl = response.venue.bestPhoto["prefix"] + "height150" +
                response.venue.bestPhoto["suffix"];
          }
        });
      });
    });

    // Creating click for the list item
    this.itemClick = function (space) {
      var markerId = space.markerId;
      google.maps.event.trigger(space.marker, "click");
    }

    // Filtering the Space list
    self.filter = ko.observable("");

    this.filteredSpaceList = ko.dependentObservable(function() {
      var q = this.filter().toLowerCase();
      //var self = this;
      if (!q) {
      // Return self.spaceList() the original array;
      return ko.utils.arrayFilter(self.spaceList(), function(item) {
        item.marker.setVisible(true);
        return true;
      });
      } else {
        return ko.utils.arrayFilter(this.spaceList(), function(item) {
          if (item.name.toLowerCase().indexOf(q) >= 0) {
          return true;
          } else {
            item.marker.setVisible(false);
          return false;
          }
        });
      }
    }, this);
  };

 // Activates knockout.js
ko.applyBindings(new ViewModel());
}
