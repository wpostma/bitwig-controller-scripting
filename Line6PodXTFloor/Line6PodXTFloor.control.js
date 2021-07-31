// Line6 Pod XT Script : Warren Postma : warren.postma@gmail.com 
// (Don"t expect support by email.  You want to ask a question ask on the KVR forums.)

loadAPI(14); // Bitwig 4.0.1+

println("PODXTLive 1.0.1. trace=0 : debug output off,  trace=1 : tracing on,  trace=2 full tracing ");

// host.setShouldFailOnDeprecatedUse(true);

var trace = 2;

load ("Extensions.js");


host.defineController("Line6", "PodXTLive", "1.0", "3937b2bc-23da-45c1-8eb0-5f83a30f3e53", "wpostma");

host.defineMidiPorts(1, 1);

var clip_mode= false;

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

var activescene = 0; // insert location for clip record
var autoplayscene = -1; // when >=0, and we press stop, in bank 2, start playing the recently recorded clip.

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

var callcount  = 0;
var last_cc = 0;




function showPopupNotification(msg) {
 println("::> "+msg);

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
   trackBank = host.createTrackBankSection(8, 4, 99); // this trackbank is probably the first 8 tracks but who the fuck knows with the vague ass documentation bitwig devs provide.
   transport = host.createTransportSection();
   keys = host.getMidiInPort(0).createNoteInput("PodXTLive Keys", "80????", "90????", "B001??", "B002??", "B007??", "B00B??", "B040??", "C0????", "D0????", "E0????");
   keys.setShouldConsumeEvents(false);
   sceneBank = host.createSceneBank(8);


   //tracks = host.createTrackBank(8, 2, 0);
   //trackBank = host.createTrackBankSection(8, 1, 0);
   
   cursorTrack = host.createCursorTrack(3, 8);
   cursorDevice = cursorTrack.getPrimaryDevice();
   //cursorTrack.selectPrevious();
   //cursorTrack.selectNext();
   
   uControl = host.createUserControls(6); // 0-5 : knobs. 
   for (var i = 0; i < 6; i++) {
      uControl.getControl(i).setLabel("Knob "+(i+1))
   }
      

   //setIndications("track");
   try {
   cursorTrack.clipLauncherSlotBank().addIsSelectedObserver	(	function(index,selected)
    {
        if (selected) {
          println(" user selected : " + index);
          activescene = index;
        }
    });
  } catch(e) {
    println("Unable to observe cursorTrack launcher selected ");
  }

  try {
    
    cursorDevice.presetName().addValueObserver( 50, "None", function(name){
    pName = name;
    if (presetHasChanged) {
       println( " ::preset::> "+name);
       presetHasChanged = false;
    }
 });
 } catch(e) {
  println( "Unable to observe preset name changes");
}


  

   

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
	   println("host notification setup failure ")
   }

   host.scheduleTask(pollState, null, 500);
}

function pollState() {
   sendSysex("F0 00 20 6B 7F 42 01 00 00 2F F7");
}

function playclipat(row, column) {
  if (row<0) {
    row = 0;
  }
  if (column<0) {
    column = 0;
  }
  if (clip_mode) {
    println("in clip mode launching scene " + column);
    trackBank.getChannel(row).getClipLauncherSlots().launch(column);
  } 
  else {
    // in scene mode the 1st row (top row in scene 1 on nano) controls scenes in Bitwig
    if (row == 0) {
        println("in scene mode and row 0, launching scene " + column);
        trackBank.launchScene(column);
    } else {
      trackBank.getChannel(row).getClipLauncherSlots().launch(column);
      println("channel launch "+row+"  " + column);
    }
}
}




var last_exec = {
	number: 0,
	bank: 0,
	vdata: 0
};

function do_function(number,bank,vdata)
{
  if (trace>0) {
    println("do_function "+number+" "+bank+" "+vdata);
  }

	// bank 1 
	if (bank == 1) {
		if ( (number == 1) &&  (vdata == 0) ){
			transport.play();
			showPopupNotification("play");
		}
		else if ( (number == 1) &&  (vdata != 0) ) {
			transport.stop();
			showPopupNotification("stop");		
		}
		else if  (number == 2) {
			transport.record();
			showPopupNotification("record");
		}
		else if  (number == 3)  {
			transport.toggleLoop();
			showPopupNotification("toggle loop");
		}	
		else if (number == 4)   {
			transport.rewind();
			showPopupNotification("rewind");
		}	
		else if (number == 5)    {
			transport.fastForward();
			showPopupNotification("fast forward");		 
		}
	}
	else if (bank == 2) {
		// bank 2 
    if ((number==1) &&(autoplayscene >=0) ) {
        //transport.stop(); // stops recording
        showPopupNotification("stop record");

        bank = cursorTrack.clipLauncherSlotBank();
        bank.select(autoplayscene);
        
        //sceneBank.launchScene(autoplayscene);
        // ransport.play();  // no worky.
        playclipat( 0, autoplayscene );

        //transport.play();
        
        showPopupNotification("loop playback "+autoplayscene);	
        autoplayscene = -1;
    }
    else
    if ( (number == 1) &&  (vdata == 0) ){
			transport.play();
			showPopupNotification("play");
		}
		else if ( (number == 1) &&  (vdata != 0) ) {
			transport.stop(); // stops recording
      
     
        showPopupNotification("stop");	
    }
		else if (number == 2) {
        // in bank 1 it"s the main record, in bank 2, let"s do a clip record.
        
        
        
        bank = cursorTrack.clipLauncherSlotBank();
        
        bank.select(activescene);
        //bank.record(activescene);
        //cursorTrack = host.createCursorTrack(3, 8);

        cursorTrack.recordNewLauncherClip (activescene);
        autoplayscene = activescene;

        activescene = activescene + 1;        
        if (activescene >= 8) {
          activescene = 0;
        }

        showPopupNotification("record clip "+activescene );
		}
		else if (number == 3) {
      transport.toggleClick();
      showPopupNotification("click track");
		}	
		else if (number == 4) {
			
      //transport.play();
      if (vdata == 0) {
        transport.continuePlayback();
        showPopupNotification("continue");
      } else {
        transport.stop();
        showPopupNotification("stop");
      }

      
		}	
		else if (number == 5)  {
      // This will play the first clip in the project if it exists.
      // If no clip exists we don't yet know what code to write to actually find out is there anything to launch
      // and then don't return true/false from the launch() method, like they should have.
      row=1;
      column=1;
      //trackBank.getChannel(row).getClipLauncherSlots().launch(column);
      trackBank.getChannel(row).getClipLauncherSlots().launch(column);

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
    

      //groove.getEnabled().set( vdata, 127);
      //showPopupNotification("groove");

      //transport.togglePunchIn();
      //showPopupNotification("punch in")
      
      //transport.togglePunchOut();
      //showPopupNotification("punch out")

		
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

  callcount = callcount +1;

    // Instantiate the MidiData Object for convenience:
   var midi = new MidiData(status, data1, data2);

if (trace>0) {
  println("onmidi "+callcount+" --> "+status+","+midi.data1+","+midi.data2);
   if (midi.isChannelController()) {
   	
	if (midi.data1==cc_switch_amp_on_off) {
   	  println("F1:AMP "+midi.data1+" "+onOff(midi.data2))
	}
	else if (midi.data1==cc_switch_stomp_on_off) {
   	  println("F2:STOMP "+midi.data1+" "+onOff(midi.data2))
	}
	else if (midi.data1==cc_switch_mod_on_off) {
   	  println("F3:MOD "+midi.data1+" "+onOff(midi.data2))
	}else if (midi.data1==cc_switch_delay_on_off) {
   	  println("F4: AMP "+midi.data1+" "+onOff(midi.data2))
	}
	else if (midi.data1==cc_momentary_tap) {
	  println("F5:TAP "+midi.data1+" "+midi.data2)
		
	}
	
	else if (midi.data1==cc_knob_01) {
	  println("K1:drive knob: "+midi.data1+" "+midi.data2);
	}
	else if (midi.data1==cc_knob_02) {
	  println("K2:bass knob: "+midi.data1+" "+midi.data2);
	}
	else if (midi.data1==cc_knob_03) {
	  println("K3:lo mid knob: "+midi.data1+" "+midi.data2);
	}
	else if (midi.data1==cc_knob_04) {
	  println("K4:hi mid knob: "+midi.data1+" "+midi.data2);
	}	
	else if (midi.data1==cc_knob_05) {
	  println("K5:treble knob: "+midi.data1+" "+midi.data2);
	}	
	else if (midi.data1==cc_knob_06) {
	  println("K6:channel vol knob: "+midi.data1+" "+midi.data2);
	}	


	else
	{
		println("Other CC#"+midi.data1+" with data value "+midi.data2)
	}



   }
   else if (midi.isNoteOn()) {
	println("note on "+midi.data1+" "+midi.data2)
   } 
   else if (midi.isNoteOff()) {
	println("note off "+midi.data1+" "+midi.data2)
   }
   else if (midi.isProgramChange()) {
	   println("program change "+midi.data1+" "+midi.data2)
   }
}// end cc trace


if (midi.isChannelController()) {

  if (midi.data1 ==cc_switch_amp_on_off) {
        //F1 functions
      if (last_cc != -1) {
        do_function(1, bank, midi.data2);
      }
  }
  else if (midi.data1 ==cc_switch_stomp_on_off) {
        //F2 functions
      do_function(2, bank, midi.data2);
  }
  else if (midi.data1 ==cc_switch_mod_on_off) {
        //F3 functions
      do_function(3, bank, midi.data2);
  }
  else if (midi.data1 ==cc_switch_delay_on_off) {
        //F4 functions
      do_function(4, bank, midi.data2);
  }
  else if (midi.data1 ==cc_momentary_tap) {
      //F5 functions [momentary]
      do_function(5, bank, 0);
      
  }
  else if (midi.data1 ==cc_knob_01) {
      //println("K1:drive knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }
  else if (midi.data1=cc_knob_02) {
      //println("K2:bass knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }
  else if (midi.data1=cc_knob_03) {
      //println("K3:lo mid knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }
  else if (midi.data1=cc_knob_04) 
  {
      //println("K4:hi mid knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }	
  else if (midi.data1=cc_knob_05) 
  {
      //println("K5:treble knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }	
  else if (midi.data1=cc_knob_06) {
      //println("K6:channel vol knob: "+midi.data1+" "+midi.data2)
      keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }	
  else if (midi.data1=cc_volume_pedal) {
    //println("vol pedal cc7");
    keys.sendRawMidiEvent(midi.status, midi.data1, midi.data2);
  }	  
  else
  {
      //println("Other CC: "+midi.data1+" "+midi.data2)
  }
  last_cc = midi.data1;

}
else if (midi.isProgramChange()) {
     // TODO PROGRAM CHANGE.
	 program= midi.data1;	
   bank = 1+Math.floor( program / 4 );

   
   // get A,B,C,D buttons as the variable bankfunction
   bankfunction = program % 4;
   if (bankfunction==0) {
     bankfunction = 4; 
   }
   if (trace>1) {
  	  println(" :: program = "+program );
      println(" :: bank = "+ bank );
      println(" :: bankfunction = "+ bankfunction );	 
      println(" :: PC may be immediately followed by a spurious CC :: ");
   }
   
   last_cc = -1;
  
   // on the current track, bankfunction 1 should select the first clip track, bankfunction 2 should select the second clip track. 

	 
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

println("READY.")

function exit()
{
   // nothing to do here ;-)
}
