
var model = {
    // Original array to load the data from when it's manipulated
    originalPoints: [
        {title: 'Kholosy Street', latlng:{lat:30.079482 ,lng:31.246152}},
        {title: 'Rahebat Elraay Elsaleh', latlng:{lat:30.077643 ,lng:31.246324}},
        {title: 'Saint Thereza Church', latlng:{lat:30.083269 ,lng:31.247439}},
        {title: 'Elsahafa Shops for Men\'s Clothes', latlng:{lat:30.080800 ,lng:31.244372}},
        {title: 'Elteraa Street', latlng:{lat:30.080436 ,lng:31.251938}},
        {title: 'Kripiano crepe', latlng:{lat:30.075348 ,lng:31.244045}}
    ],
    favPoints: [
        {title: 'Kholosy Street', latlng:{lat:30.079482 ,lng:31.246152}},
        {title: 'Rahebat Elraay Elsaleh', latlng:{lat:30.077643 ,lng:31.246324}},
        {title: 'Saint Thereza Church', latlng:{lat:30.083269 ,lng:31.247439}},
        {title: 'Elsahafa Shops for Men\'s Clothes', latlng:{lat:30.080800 ,lng:31.244372}},
        {title: 'Elteraa Street', latlng:{lat:30.080436 ,lng:31.251938}},
        {title: 'Kripiano crepe', latlng:{lat:30.075348 ,lng:31.244045}}
    ]
};

var viewModel = { 

    favPoints: ko.observableArray(model.favPoints),
    map: null,
    markers: [],
    infoWindow: null,
    filterby: ko.observable(),
    filteredItems: null,

    
    // open InfoWindow of a specific marker, load data from wikimedia, and add animation
    openInfoWindow: function (marker, infoWindow) { 
        var url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&gscoord='+marker.getPosition().lat()+'%7C'+marker.getPosition().lng()+'&gsradius=10000&gslimit=10';

        if (infoWindow.marker != marker){
            $.ajax({
                type: "GET",
                url: url,
                dataType: "jsonp",
                success: function (response) {
                    if(!response.error){
                        putmarker(response.query.geosearch);
                    }
                },
                error: function (xhr, error) {
                  alert(xhr.status + " Error Loading info about nearby places, error type: " + error);
                  putmarker([]);
                }
            });
        }
        putmarker = function (nearby) {  
            if (infoWindow.marker != marker){
                infoWindow.marker = marker;
                if(nearby.length>0){
                    infoWindow.setContent('<h6>'+marker.title+'</h6><ul><p>Nearby Places:</p><li>'+nearby[0].title+'</li><li>'+nearby[1].title+'</li><li>'+nearby[2].title+'</li></ul>');
                }
                else{
                    infoWindow.setContent('<h6>'+marker.title+'</h6>');
                }

                infoWindow.open(map, marker);

                for(var i = 0; i<viewModel.markers.length; i++){
                    if(viewModel.markers[i].getAnimation() !== null && viewModel.markers[i] !== marker){
                        viewModel.markers[i].setAnimation(null);
                    }
                }
                marker.setAnimation(google.maps.Animation.BOUNCE);

                infoWindow.addListener('closeclick', function() {
                    this.marker = null;
                    marker.setAnimation(null);
                });
            }
            
        };
    },
    
    // load the map to the specific div and put the markers
    initMap : function () {  

        viewModel.infoWindow = new google.maps.InfoWindow();

        var map = new google.maps.Map($('#map')[0], {
            center : {lat:30.079396, lng:31.245343},
            zoom: 15,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                },
            navigationControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        viewModel.map = map;
        ko.utils.arrayForEach(this.favPoints(), function(point, index) {
            var marker = new google.maps.Marker({
                position: point.latlng,
                title: point.title,
                map: map,
                animation: google.maps.Animation.DROP,
                id : index
            });
            viewModel.markers.push(marker);

            marker.addListener('click', function() {
                viewModel.openInfoWindow(this, viewModel.infoWindow);
            });

        });

    },

    mapError: function(){
        alert("Error Loading Google Maps");
    },

    // toggle the side bar
    toggleMenu : function(){     
        $("#wrapper").toggleClass("toggled");
        $("#wrapper").one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
            // code to execute after transition ends
            google.maps.event.trigger(map, 'resize');
        });
    },

    // open InfoWindow when list item is clicked
    showInfo: function (point) {  
            var marker;
            for(var i=0; i<viewModel.markers.length; i++){
                if(viewModel.markers[i].title == point.title){ 
                    marker = viewModel.markers[i]; 
                    break; 
                }
            }
            viewModel.openInfoWindow(marker, viewModel.infoWindow);
    },

    // Rerender markers on the map when filter list items
    renderMarkers: function(){
        for(var i=0; i<this.markers.length; i++){
            var exist = false;
            ko.utils.arrayForEach(this.favPoints(), function(point, index) {
                if(viewModel.markers[i].title == point.title ){
                    exist = true;
                }
            });
            if(exist == true){viewModel.markers[i].setMap(viewModel.map);}
            else{viewModel.markers[i].setMap(null);}
        }
    },

    // Filter List Items
    placesFilter: function (newValue) {  
        if(newValue != null && newValue != ''){
            var allpoints = model.favPoints, foundpoints = [];
    
            viewModel.filteredItems = ko.computed(function(){            
                for (var i = 0; i<allpoints.length; i++) {
                    if(allpoints[i].title.toLowerCase().includes(newValue.toLowerCase())){
                        foundpoints.push(allpoints[i]);
                    }
                };
                return foundpoints;
            });
    
            
            viewModel.favPoints.removeAll();
    
            ko.utils.arrayForEach(viewModel.filteredItems(), function(point, index) {
                viewModel.favPoints.push(point);
            });
            model.favPoints = model.originalPoints;
    
            viewModel.renderMarkers();
        }
        else if (!newValue){
            viewModel.favPoints.removeAll();
    
            for (var i = 0; i<model.favPoints.length; i++) {
                viewModel.favPoints.push(model.favPoints[i]);
            };
    
            viewModel.renderMarkers();
        }
    }

};

var view = {  

};

viewModel.filterby.subscribe(function(newValue) {
    viewModel.placesFilter(newValue);
});

ko.applyBindings(viewModel);
