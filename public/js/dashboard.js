function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$(document).ready(function() {

  // Global Stats
  async function getGlobalStats(){
    performSearch("US")
    var queryURL = "https://api.covid19api.com/summary";
    await $.ajax({
      url: queryURL,
      method: "GET"
    }).then(function(response) {
      $('#globalTitle').text('Global Statistics');
      $('#globalConfirmed').text(numberWithCommas(response.Global.TotalConfirmed+' Positive Cases'));
      $('#globalRecovered').text(numberWithCommas(response.Global.TotalRecovered+' Recoveries'));
      $('#globalDeaths').text(numberWithCommas(response.Global.TotalDeaths+' Deaths'));
    }).catch(function(error){
      console.log(error)
    });
  }
  getGlobalStats()

  // US Stats
  async function getUSAStats(){
    var queryURL = "https://api.covid19api.com/summary";
    await $.ajax({
      url: queryURL,
      method: "GET"
    }).then(function(response) {
      $('#countryTitle').text('United States Statistics');
      $('#countryConfirmed').text(numberWithCommas(response.Countries[177].TotalConfirmed));
      $('#countryRecovered').text(numberWithCommas(response.Countries[177].TotalRecovered));
      $('#countryDeaths').text(numberWithCommas(response.Countries[177].TotalDeaths));
    }).catch(function(error){
      console.log(error)
    });
  }
  getUSAStats()

  // Heatmap Data 
  var addressPoints = []
  async function getMapData(){
    await $.ajax({
      url: '/api/covid_data/deaths',
      method: "GET"
    }).then(function(response) {
      for (let index = 0; index < response.length; index++) {
        const element = response[index];
        const arrayConstruct = []
        arrayConstruct.push(element.latitude)
        arrayConstruct.push(element.longitude)
        arrayConstruct.push(element.deaths)
        addressPoints.push(arrayConstruct)
      }
    }).catch(function(error){
      console.log(error)
    });
  }

  // Prepare the map
  var map
  async function generateMap(lat,lon){
    if (map){
      map.remove();
    }
    if (!lat || !lon) {
      // Set default map position to North America
      map = L.map("map").setView([39.82109, -94.2193], 4);
    } else {
      // Zoom map to latitude and longitude
      map = L.map("map").setView([lat, lon], 6);
    }
      // Set theme, try 'DarkGray'
    await L.esri.basemapLayer("Gray").addTo(map);
    await L.heatLayer(addressPoints).addTo(map), draw = true;
  }

  // IP to location API
  async function ipSearch(){
    await $.ajax({
      url: 'http://ip-api.com/json?callback=?',
      method: "GET",
      dataType: 'json',       
      jsonp: 'callback'
    }).then(function(response) {
      //console.log(response)
      if (response.country === "United States"){   
        // Special Case for US to fix stats table results     
        $("#country_input").val("US")
        //console.log("IP performSearch US")
        performSearch("US")
      } else {
        $("#country_input").val(response.country)
        //console.log("IP performSearch "+response.country)
        performSearch(response.country)
      }
      generateMap(response.lat, response.lon)
    }).catch(function(error){
      console.log(error)
    });
  }
  
  $("#icon-geolocate").click(async function(){
    console.log("Geolocate User...")
    $("#icon-geolocate").toggleClass("fa-crosshairs")
    $("#icon-geolocate").toggleClass("fa-spinner fa-pulse")
    
    // Request User's Location via the browser
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log('Location from Browser')
      navigator.geolocation.getCurrentPosition(showPosition);
      // Should find a better way to table search based on lat+lon, but for now using IP API
      ipSearch()
    },
    function(error) {
      if (error.code == error.PERMISSION_DENIED){
        // IP to Country API query
        console.log('Browser Location Denied, Trying by IP')
        ipSearch()
      }
    });
    function showPosition(position) { 
      generateMap(position.coords.latitude, position.coords.longitude)
    }

    $("#icon-geolocate").toggleClass("fa-crosshairs")
    $("#icon-geolocate").toggleClass("fa-spinner fa-pulse")
  })

  // Add heatmap data
  // The last number represents intensity as a decimal, this needs work
  //addressPoints = addressPoints.map( p => [p[0], p[1], parseFloat('.'+p[2]) ] );

  //generateMap()
  //getMapData().then(generateMap);
  
  // GET request to figure out which user is logged in
  // updates the HTML on the page
  $.get("/api/user_data").then(function(data) {
    if (data.email){      
      $('.buttons').css("display", "none");
      $(".member-name").text('Welcome '+data.email);
      $(".member-name").append(' | <a href="./logout">Logout</a>')
      //console.log(data.subscription)
      if (data.subscription){
        // Check it
        $(".member-name").append(`<div class="b-checkbox is-success is-circular">
        <input name="subscription-navbar" id="subscription-navbar" class="styled" checked type="checkbox">
        <label for="subscription-navbar" id="subscription-message">
            Subscribed to Newsletter
        </label>
    </div>`)
      } else {
        $(".member-name").append(`<div class="b-checkbox is-success is-circular">
        <input name="subscription-navbar" id="subscription-navbar" class="styled" type="checkbox">
        <label for="subscription-navbar" id="subscription-message">
            Subscribe to Newsletter
        </label>
    </div>`)
      }
      $("#subscription-navbar").click(function(){
        if (data.subscription){
          $.ajax({
            url: '/api/subscribe/'+data.id,
            type: 'PUT',
            data: {subscription:false},
            success: function(data) {
              console.log('Unsubscribed')
              console.log(data)
            }
          });
        } else {
          $.ajax({
            url: '/api/subscribe/'+data.id,
            type: 'PUT',
            data: {subscription:true},
            success: function(data) {
              console.log('Subscribed')
              console.log(data)
            }
          });
        }
        
        $('#subscription-message').text($('#subscription-message').text() == 'Subscribe to Newsletter' ? 'Subscribed to Newsletter' : 'Subscribe to Newsletter');
      }); 
      
    } else {
      $('.buttons').css("display", "block");
    }
  });

  // Regenerate the map
  // Add heatmap data
  async function regenMap(){
    //addressPoints = addressPoints.map( p => [p[0], p[1], parseFloat('.'+p[2]) ] );
    //generateMap()
    getMapData().then(generateMap);
    //L.heatLayer(addressPoints).addTo(map), draw = true;
  }
  regenMap();
  
  
});
// User Login/Signup Modal
$("#auth-signup").click(function() {
  $("#modal-register").addClass("is-active");
});
$("#auth-login").click(function() {
  $("#modal-signup").addClass("is-active");
});
$(".exit-modal").click(function() {
  $("#modal-signup").removeClass("is-active");
  $( "#modal-register").removeClass("is-active");
});
// Escape key press exits modal
$(document).keyup(function(e) {
  if (e.key === "Escape") {
    $("#modal-signup").removeClass("is-active");
    $("#modal-register").removeClass("is-active");
  }
});
// Navbar menu toggle
$('#navbar-toggle').click(function() {
  $('#navbarBasicExample, .navbar-menu').toggleClass('is-active');
  $('.navbar-burger').toggleClass('is-active');
});
