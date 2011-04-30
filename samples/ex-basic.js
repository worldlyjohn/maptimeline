/** 
 * @fileoverview This file is to be used to demonstrate the capabilities
 * of the {@link http://code.google.com/p/maptimeline/ MapTimeline module}.
 *
 * This demo shows how to use the basic MapTimeline object
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8
 */

(function() {
	var mt = null;

 	function loadMTL(){
	 	//
	 	// initialize the MapTimeline component
        //
        mt = new MapTimeline();
        
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
    	mt.addEvent('1', '2008-11-13 12:58Z', null, 'San Diego', 'Location where this code was developed', 32.65714, -117.241);
    	mt.addEvent('2', '2008-11-15 12:58Z', null, 'Sudan', 'Don\'t forgot the conflicts in Darfur', 15, 30);
    	mt.addEvent('3', '2007-02-13 12:58Z', null, 'Tibet', 'The Tibetan people are denied most rights guaranteed in the Universal Declaration of Human Rights, including the rights to self-determination, freedom of speech, assembly, movement, expression, and travel', 29.8, 83.6);
 	}
	
	loadMTL();
	addEvents();
})();
 