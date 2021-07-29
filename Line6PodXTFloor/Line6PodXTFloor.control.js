// Line6 Pod XT Script : Warren Postma : warren.postma@gmail.com 
// (Don't expect support by email.  You want to ask a question ask on the KVR forums.)

loadAPI(1);

var trace = 0;

load ("Extensions.js");


host.defineController("Line6", "PodXTLive", "1.0", "9694E601-0A0E-4535-8A7A-2F935A1BB286");
host.defineMidiPorts(1, 1);



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

// global:
var cc_volume_pedal 	= 7;

// knobs:
var cc_knob_01 = 13; // drive knob in the amp tone controls
var cc_knob_02 = 14; // bass  knob in the amp tone controls
var cc_knob_03 = 15; // lo mid knob in the amp tone controls
var cc_knob_04 = 16; // hi mid knob in the amp tone controls
var cc_knob_05 = 21; // treble knob in the amp tone controls
var cc_knob_06 = 17; // channel volume knob in the amp tone controls

// switches:  Turn on and off. 0=off,127=on
var cc_switch_amp_on_off	= 111;
var cc_switch_stomp_on_off	= 25;
var cc_switch_mod_on_off	= 50;
var cc_switch_delay_on_off	= 28;

// preset buttons (A,B,C,D) come in as program control
// not as CC!

// momentary:
var cc_momentary_tap  		= 64;

// program change stuff
var program = 1;
var bank = 1;



function showPopupNotification(msg) {
 println('::> '+msg);
 host.showPopupNotification(msg);
}

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
  host.getMidiInPort(0).setSysexCallback(onSysex);

	
	
	
   


   
   // Creating the main objects:
   application = host.createApplicationSection();
   groove = host.createGrooveSection();
   masterTrack = host.createMasterTrackSection(0);
   trackBank = host.createTrackBankSection(8, 4, 99);
   transport = host.createTransportSection();
   
   //tracks = host.createTrackBank(8, 2, 0);
   //trackBank = host.createTrackBankSection(8, 1, 0);
   
   cTrack = host.createCursorTrack(3, 0);
   cDevice = cTrack.getPrimaryDevice();
   
   uControl = host.createUserControls(6); // 0-5 : knobs. 
   for (var i = 0; i < 6; i++) {
      uControl.getControl(i).setLabel("Knob "+(i+1))
   }
      

   //setIndications("track");



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
		    println('::page name:: '+j+' '+names[j]);
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



var last_exec = {
	number: 0,
	bank: 0,
	vdata: 0
};

function do_function(number,bank,vdata)
{
  println('do_function '+number+' '+bank+' '+vdata);
  
	// bank 1 
	if (bank == 1) {
		if ( (number == 1) &&  (vdata == 0) ){
			transport.play();
			println('play');
		}
		else if ( (number == 1) &&  (vdata != 0) ) {
			transport.stop();
			println('stop');		
		}
		else if  (number == 2) {
			transport.record();
			print('record');
		}
		else if  (number == 3)  {
			transport.toggleLoop();
			print('toggle loop');
		}	
		else if (number == 4)   {
			transport.rewind();
			print('rewind');
		}	
		else if (number == 5)    {
			transport.fastForward();
			print('fast forward');		 
		}
	}
	else if (bank == 2) {
		// bank 2 
		if (number == 1) {
			transport.togglePunchIn();
		}
		else if (number == 2) {
			transport.togglePunchOut();
		}
		else if (number == 3) {
			transport.toggleClick();
		}	
		else if (number == 4) {
			//SOLO
			groove.getEnabled().set( vdata, 127);
		}	
		else if (number == 5)  {
			// TODO, BANK 2, FUNCTION 5
		}	
	}
	else if (bank == 3 ) {
		// bank 3
		if (number == 1)  {
			trackBank.scrollTracksPageUp();
		}
		else if (number == 2)  {
			trackBank.scrollTracksPageDown();
		}
		else if (number == 3)  {
			cursorTrack.selectPrevious();
		}	
		else if (number == 4)  {
			cursorTrack.selectNext();	
		}	
		else if (number == 5)   {
			// todo
		}	
		
	}
	
		

		 
	last_exec.number = number;
	last_exec.bank = bank;
	last_exec.vdata = vdata;
	
	
}

function onOff(dvalue) {
  if (dvalue==0) {
    return "OFF";
  }
  else {
    return "ON";
  }
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
   	
	if (midi.data1=cc_switch_amp_on_off) {
   	  println('F1:AMP '+midi.data1+' '+onOff(midi.data2))
	}
	else if (midi.data1=cc_switch_stomp_on_off) {
   	  println('F2:STOMP '+midi.data1+' '+onOff(midi.data2))
	}
	else if (midi.data1=cc_switch_mod_on_off) {
   	  println('F3:MOD '+midi.data1+' '+onOff(midi.data2))
	}else if (midi.data1=cc_switch_delay_on_off) {
   	  println('F4: AMP '+midi.data1+' '+onOff(midi.data2))
	}
	else if (midi.data1=cc_momentary_tap) {
	  println('F5:TAP '+midi.data1+' '+midi.data2)
		
	}
	
	else if (midi.data1=cc_knob_01) {
	  println('K1:drive knob: '+midi.data1+' '+midi.data2)
	}
	else if (midi.data1=cc_knob_02) {
	  println('K2:bass knob: '+midi.data1+' '+midi.data2)
	}
	else if (midi.data1=cc_knob_03) {
	  println('K3:lo mid knob: '+midi.data1+' '+midi.data2)
	}
	else if (midi.data1=cc_knob_04) {
	  println('K4:hi mid knob: '+midi.data1+' '+midi.data2)
	}	
	else if (midi.data1=cc_knob_05) {
	  println('K5:treble knob: '+midi.data1+' '+midi.data2)
	}	
	else if (midi.data1=cc_knob_06) {
	  println('K6:channel vol knob: '+midi.data1+' '+midi.data2)
	}	


	else
	{
		println('Other CC: '+midi.data1+' '+midi.data2)
	}



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
}// end cc trace


if (midi.isChannelController()) {
  if (midi.data1=cc_switch_amp_on_off) {
        //F1 functions
      do_function(1, bank, midi.data2);
  }
  else if (midi.data1=cc_switch_stomp_on_off) {
        //F2 functions
      do_function(2, bank, midi.data2);
  }
  else if (midi.data1=cc_switch_mod_on_off) {
        //F3 functions
      do_function(3, bank, midi.data2);
  }
  else if (midi.data1=cc_switch_delay_on_off) {
        //F4 functions
      do_function(4, bank, midi.data2);
  }
  else if (midi.data1=cc_momentary_tap) {
      //F5 functions [momentary]
      do_function(5, bank, 0);
      
  }
  else if (midi.data1=cc_knob_01) {
      //println('K1:drive knob: '+midi.data1+' '+midi.data2)
  }
  else if (midi.data1=cc_knob_02) {
      //println('K2:bass knob: '+midi.data1+' '+midi.data2)
  }
  else if (midi.data1=cc_knob_03) {
      //println('K3:lo mid knob: '+midi.data1+' '+midi.data2)
  }
  else if (midi.data1=cc_knob_04) 
  {
      //println('K4:hi mid knob: '+midi.data1+' '+midi.data2)
  }	
  else if (midi.data1=cc_knob_05) 
  {
      //println('K5:treble knob: '+midi.data1+' '+midi.data2)
  }	
  else if (midi.data1=cc_knob_06) {
      //println('K6:channel vol knob: '+midi.data1+' '+midi.data2)
  }	
  else
  {
      //println('Other CC: '+midi.data1+' '+midi.data2)
  }
}
else if (midi.isProgramChange()) {
     // TODO PROGRAM CHANGE.
	 program= midi.data1;	
	 bank = program / 4;
	 bankfunction = program % 4;
	 
	 println(' program = '+program );
	 println(' bank = '+ bank );
	 println(' bankfunction = '+ bankfunction );	 
	 
   }

}

function onSysex(data) {
   printSysex(data);
   println("sysex:"+data);
}

/*
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
*/

/*
function setIndications() {
   var track = false;
   var send = false;
   var device = false;
   var preset = false;
   var arturia = false;
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
*/

function exit()
{
   // nothing to do here ;-)
}
