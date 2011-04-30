/** 
 * @fileoverview This file is to be used to demonstrate the capabilities
 * of the {@link http://code.google.com/p/maptimeline/ MapTimeline module}.
 *
 * This demo shows how to add events dynamically with an external source
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8
 */

(function() {
	var mt = null;

 	function loadMTL(){
        // create options for MapTimeline
        var mtlOptions = {
            'timecenter': new Date("November 27, 2008 13:14:00")
        };
        
	 	//
	 	// initialize the MapTimeline component
        //
        mt = new MapTimeline(mtlOptions);
        
        //
        // customize the map controls
        //
        mt.initMap('map');
        mt.addControl(new OpenLayers.Control.MousePosition());
        
        //
        // customize the timeline controls
        //
        mt.initTimeline('timeline');
        
	}
 	function addEvents(){
	 	SimileAjax.jQuery.getJSON('example_json.js', {}, function(json){
		 	mt.addEvents(json.events);
		});
 	}
	
	loadMTL();
	addEvents();
})();
 