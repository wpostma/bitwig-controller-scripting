// Line6 Pod XT Script
// Adapted from the Arturia MiniLab Script

loadAPI(1);

var trace = 0;

load ("Extensions.js");

// host.defineController("Arturia", "MiniLab", "1.0", "e48ffd90-3203-11e4-8c21-0800200c9a66");

host.defineController("Line6", "PodXTLive", "1.0", "9694E601-0A0E-4535-8A7A-2F935A1BB286");


host.defineMidiPorts(1, 1);


var CurrentBank = 1; // If we receive a program change for preset program 1, we are in bank 1.  

var Mode = "Track";
var SubMode = "VolPan";
var tName = "None";
var tNameHasChanged = false;
var dName = "None";
var dNameHasChanged = false;
var pName = "None";
var presetHasChanged = false;
var pageNames = [];
var pageNumber = 0;
var pageHasChanged = false;


function showPopupNotification(msg) {
 println('::> '+msg);
 host.showPopupNotification(msg);
}

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);

	transport = host.createTransportSection();
	application = host.createApplicationSection();
	trackBank = host.createTrackBankSection(8, 1, 0);
	
   


   
   // Creating the main objects:
   transport = host.createTransport();
   tracks = host.createTrackBank(8, 2, 0);
   cTrack = host.createCursorTrack(3, 0);
   cDevice = cTrack.getPrimaryDevice();
   uControl = host.createUserControls(16);

   setIndications("track");

 //  for (var i = 0; i < 8; i++) {
//      uControl.getControl(i).setLabel("CC " + Knobs1[i])
  //uControl.getControl(i + 8).setLabel("CC " + Knobs2[i])
  // }

   cTrack.addNameObserver(50, "None", function(name){
      tName = name;
      if (tNameHasChanged) {
         println('::track::> '+name);
         tNameHasChanged = false;
      }
   });

   cDevice.addNameObserver(50, "None", function(name){
      dName = name;
      if (dNameHasChanged) {
         println('::device::> '+name);
         dNameHasChanged = false;
      }
   });

   cDevice.addPresetNameObserver(50, "None", function(name){
      pName = name;
      if (presetHasChanged) {
         println('::preset::> '+name);
         presetHasChanged = false;
      }
   });

   cDevice.addPageNamesObserver(function(names) {
      pageNames = [];
      for(var j = 0; j < names.length; j++) {
         pageNames[j] = names[j];
		 println('::page name::> '+name);
      }
   });

   cDevice.addSelectedPageObserver(-1, function(val) {
      pageNumber = val;
      if (pageHasChanged) {
         println("Parameter Page " + (val+1) + ": " + pageNames[val]);
         pageHasChanged = false;
      }
   });

   try {
      host.getNotificationSettings().setShouldShowSelectionNotifications (true);
      host.getNotificationSettings().setShouldShowChannelSelectionNotifications (true);
      host.getNotificationSettings().setShouldShowTrackSelectionNotifications (true);
      host.getNotificationSettings().setShouldShowDeviceSelectionNotifications (true);
      host.getNotificationSettings().setShouldShowDeviceLayerSelectionNotifications (true);
      host.getNotificationSettings().setShouldShowPresetNotifications (true);
      host.getNotificationSettings().setShouldShowMappingNotifications (true);
      host.getNotificationSettings().setShouldShowValueNotifications (true);
   } catch(e) {
	   println('notification setup failure ')
   }

   host.scheduleTask(pollState, null, 500);
}

function pollState() {
   sendSysex("F0 00 20 6B 7F 42 01 00 00 2F F7");
}


function onMidi(status, data1, data2) {

 if (trace==1) {  
     var command = status & 0xf0;
     var channel = (status & 0x0f) + 1;
     println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);
   }

   // Instantiate the MidiData Object for convenience:
   var midi = new MidiData(status, data1, data2);

if (trace==2) {
   if (midi.isChannelController()) {
   	println('CC '+midi.data1+' '+midi.data2)
   }
   else if (midi.isNoteOn()) {
	println('note on '+midi.data1+' '+midi.data2)
   } 
   else if (midi.isNoteOff()) {
	println('note off '+midi.data1+' '+midi.data2)
   }
   else if (midi.isProgramChange()) {
	   println('program change '+midi.data1+' '+midi.data2)
   }
}


   if (midi.isChannelController()) {
     // TODO MIDI CC HANDLING
   }
   else if (midi.isProgramChange()) {
     // TODO PROGRAM CHANGE.
   }
}

function onSysex(data) {
   printSysex(data);
   println("sysex:"+data);
}

function knobFunc(Row, index, midi) {
   var inc = (midi.data2 - 64) * 0.1;
   //println(inc);
   switch (Mode) {
      case "Track":
         if (SubMode === "VolPan") {
            if (Row === 1) {
               tracks.getTrack(index).getVolume().inc(inc, 256);
            }
            else {
               tracks.getTrack(index).getPan().inc(inc, 128);
            }
         }
         else {
            if (Row === 1) {
               tracks.getTrack(index).getSend(0).inc(inc, 128);
            }
            else {
               tracks.getTrack(index).getSend(1).inc(inc, 128);
            }
         }
         break;
      case "Device":
         if (Row === 1) {
            cDevice.getMacro(index).getAmount().inc(inc, 128);
         }
         else {
            cDevice.getCommonParameter(index).inc(inc, 128);
         }
         break;
      case "Preset":
         if (Row === 1) {
            cDevice.getEnvelopeParameter(index).inc(inc, 128);
         }
         else {
            cDevice.getParameter(index).inc(inc, 128);
         }
         break;
      case "Arturia":
         MiniLabKeys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
         if (Row === 1) {
            uControl.getControl(index).inc(inc, 128);
         }
         else {
            uControl.getControl(index + 8).inc(inc, 128);
         }

         break;
   }
}

function setIndications() {
   var track = false;
   var send = false;
   var device = false;
   var preset = false;
   var arturia = false;

   // Pad Light feedback disabled because of we have no way of knowing what mode the MiniLab is in.

   //sendSysex("F0 00 20 6B 7F 42 02 00 10 78 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 79 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7A 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7B 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7C 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7D 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7E 00 F7");
   //sendSysex("F0 00 20 6B 7F 42 02 00 10 7F 00 F7");
   switch (Mode) {
      case "Track":
         if (SubMode === "VolPan") {
            track = true;
            //sendSysex("F0 00 20 6B 7F 42 02 00 10 78 01 F7");
            //sendSysex("F0 00 20 6B 7F 42 02 00 10 7C 01 F7");
         }
         else {
            send = true;
            //sendSysex("F0 00 20 6B 7F 42 02 00 10 78 01 F7");
            //sendSysex("F0 00 20 6B 7F 42 02 00 10 7D 01 F7");
         }
         break;
      case "Device":
         device = true;
         //sendSysex("F0 00 20 6B 7F 42 02 00 10 79 01 F7");
         break;
      case "Preset":
         preset = true;
         //sendSysex("F0 00 20 6B 7F 42 02 00 10 7A 01 F7");
         break;
      case "Arturia":
         arturia = true;
         //sendSysex("F0 00 20 6B 7F 42 02 00 10 7B 01 F7");
         break;
   }
   for (var i = 0; i < 8; i++) {
      tracks.getTrack(i).getVolume().setIndication(track);
      tracks.getTrack(i).getPan().setIndication(track);
      tracks.getTrack(i).getSend(0).setIndication(send);
      tracks.getTrack(i).getSend(1).setIndication(send);
      cDevice.getMacro(i).getAmount().setIndication(device);
      cDevice.getCommonParameter(i).setIndication(device);
      cDevice.getEnvelopeParameter(i).setIndication(preset);
      cDevice.getParameter(i).setIndication(preset);
      uControl.getControl(i).setIndication(arturia);
      uControl.getControl(i + 8).setIndication(arturia);
   }

}

function exit()
{
   // nothing to do here ;-)
}
