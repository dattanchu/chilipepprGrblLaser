// Test this element. This code is auto-removed by the chilipeppr.load()
cprequire_test(["inline:com-chilipeppr-widget-serialport"], function (sp) {
    console.log("test running of " + sp.id);
    //sp.init("192.168.1.7");
    sp.setSingleSelectMode();
    sp.init(null, "tinyg");
    //sp.init(null, "grbl");
    sp.consoleToggle();

    var test = function() {
        setTimeout(function() {
            for (ctr = 0; ctr < 3; ctr++) {
                //sp.sendBuffered('{"sr":""}\n');
                //sp.sendBuffered('{"qr":""}\n');
                sp.sendBuffered('{"sr":""}\n{"qr":""}\n');
            }
        }, 5000);
    }
    //test()

    var test2 = function() {
        for (ctr = 0; ctr < 30; ctr++) {
            setTimeout(function() {
                sp.sendBuffered('{"sr":""}\n');
                sp.sendBuffered('{"qr":""}\n');
            }, 5000 + (ctr * 2));
        }
    }
    //test2()

    setTimeout(function() {
        chilipeppr.publish("/com-chilipeppr-widget-serialport/requestSingleSelectPort", "");
    }, 2000);

    /*
     setTimeout(function() {
     chilipeppr.publish("/" + sp.id + "/send", '{"sr":""}\n{"sr":""}\n{"sr":""}\n{"sr":""}\n');
     //chilipeppr.publish("/" + sp.id + "/ws/send", 'send COM22 {"sr":""}\nsend COM22 {"sr":""}\nsend COM22 {"sr":""}\nsend COM22 {"sr":""}\n');
     }, 2000);
     setTimeout(function() {
     //    chilipeppr.publish("/" + sp.id + "/ws/send", 'send COM22 {"sr":""}\n');
     }, 1000);
     */
    //sp.wsScan();
} /*end_test*/ );

cpdefine("inline:com-chilipeppr-widget-serialport", ["chilipeppr_ready", "jquerycookie"], function () {
    return {
        id: "com-chilipeppr-widget-serialport",
        url: "http://fiddle.jshell.net/chilipeppr/4RgrS/show/light/",
        fiddleurl: "http://jsfiddle.net/chilipeppr/4RgrS/",
        name: "Widget / Serial Port v2",
        desc: "This widget shows your available serial ports. It must connect with your local serial port Ajax server that ChiliPeppr provides for Windows, Mac, and Linux.",
        publish: {
            '/list' : "Sends the list of serial ports shown in this widget including the connect state so other widgets/elements in ChiliPeppr can use the list including knowing what serial ports to send/recv from. Send in /list and get back a /getlist with the JSON payload of the list.",
            '/ws/onconnect' : 'When the websocket connects. This widget currently supports only a single websocket. In the future, multiple websockets will be supported and a ws identifier will be attached. For now, you will receive the string "connected" in the payload. For multiple websockets a 2nd parameter will be published with the ws:// url',
            '/ws/ondisconnect' : "When the websocket disconnects.",
            '/ws/sys' : "A system message. Mostly for visual display like an error.",
            '/ws/recv' : "A signal published when the websocket receives data from the serial port server. The serial port, i.e. COM21, the websocket identifier, and data are sent.",
            '/onportopen' : 'Published when the Serial Port JSON Server tells us a port was opened. This could happen from the user clicking to open, or if another browser or websocket client opens it, we will fire off this signal as well. The payload looks like {Cmd: "Open", Desc: "Got register/open on port.", Port: "COM22", Baud: 115200, BufferType: "tinyg"} ',
            '/onportclose' : 'Published when the Serial Port JSON Server tells us a port was closed. This could happen from the user clicking to close, or if another browser, or SPJS, or websocket client closes it, we will fire off this signal. The payload looks like {Cmd: "Close", Desc: "Got unregister/close on port.", Port: "COM22", Baud: 115200} ',
            '/onportopenfail' : 'Published when the Serial Port JSON Server tells us a port was attempting to be opened but failed for some reason. This could happen from the user clicking to open, or if another browser tries to open, but an error arose such as the port being locked by another process. The payload looks like {Cmd: "OpenFail", Desc: "Got error reading on port. ", Port: "COM22", Baud: 115200}',
            '/recvline' : "We publish this signal in tandem with /ws/recv but we only publish this signal per newline. That way your widget can consume per line data which is typically the way you want it. We recommend you subscribe to this channel instead of /ws/recv to have less work to do of looking for newlines. When in setSingleSelectMode() we will only send you data for the port that is selected (in green in UI). You will not get this signal for secondary ports that are open. For secondary ports, you need to subscribe to /ws/recv and do lower level parsing.",
            '/recvSingleSelectPort' : "In case any other widget/element wants to know what port is single selected (when in setSingleSelectMode()), they can send a signal to /requestSingleSelectPort and we'll respond back with this signal with an object like: " + JSON.stringify({
                "Name": "COM22",
                "Friendly": "USB Serial Port (COM22)",
                "IsOpen": true,
                "Baud": 115200,
                "RtsOn": true,
                "DtrOn": false,
                "BufferAlgorithm": "tinyg",
                "AvailableBufferAlgorithms": [
                    "default",
                    "tinyg",
                    "dummypause"
                ],
                "Ver": 1.7
            }, undefined, 2) + ". Will send back a null if no ports or no singleSelectPort is defined.",
            '/onQueue' : 'This signal is published when a command is queued on SPJS. Payload is {"Id":"123", "D":"G0 X1\n"}. You get the data back because if another browser sent into the SPJS, you get that data reflected in other browsers which is important for synchronizing. See /jsonSend for more info.',
            '/onWrite' : 'This signal is published when a command is written to the serial port on SPJS. Payload is {"Id":"123"}. The serial command is not reiterated in this signal like it is in /onQueue. See /jsonSend for more info.',
            '/onComplete' : 'This signal is published when a command is done being written on SPJS and is known to have been processed by the serial device. Payload is {"Id":"123"}. Please note that sometimes /jsonOnComplete could come back before /jsonOnWrite due to the multi-threaded nature of serial ports and writing/reading as well as network congestion. See /jsonSend for more info.'
        },
        subscribe: {
            '/ws/send' : "This widget subscribes to this signal so anybody can publish to a serial port by publishing here. You must specify which websocket (since multiple are supported, i.e. you could have 10 serial port servers running), and which serial port, i.e. COM21, and the data you are sending. Choosing which websocket not supported yet.",
            '/send' : "This widget subscribes to this signal whereby you can simply send to this pubsub channel (instead of /ws/send which is lower level) and the widget will send to all serial ports that you are connected to at the same time. This is useful if you are sychronizing multiple hardware. You may put this widget into setSingleSelectMode() and then it will be the last port you opened that the data is sent to indicated by a green highlight in the UI. Most serial devices expect newline characters, so you should send those in your string as this pubsub channel does not add them.",
            '/jsonSend' : '<p>This signal is like /send but a more structured version where you can send us commands like {"D": "G0 X1\n", "Id":"123"} or an array like [{"D": "G0 X1\n", "Id":"123"}, {"D": "G0 X2\n", "Id":"124"}] and then this widget will send callback signals in order of /onQueue, /onWrite, /onComplete. The payload is {"Id":"123"} on each of those.</p> <p>The SPJS has 3 steps to get your command to the serial device. Step 1 is /onQueue and this will come back immediately when SPJS has taken your command and queued it to memory/disk. Step 2 is /onWrite when SPJS actually has written your command to the serial device. If the device takes a while to execute the command it could be a bit of time until that command is physically executed. Step 3 is /onComplete which is SPJS attempting to watch for a response from the serial device to determine that indeed your command is executed. Please note /onComplete can come back prior to /onWrite based on your serial device and how fast it may have executed your serial command.</p> <p>You can omit the Id if you do not care about tracking. You will get callbacks with an empty Id so you will not be able to match them up. If you send in /jsonSend {"D": "G0 X1\nG0 X0\n", "Id":"123"} you will get back /onQueue [{"D":"G0 X1\n","Id":"123","Buf":"Buf"},{"D":"G0 X0\n","Id":"123-part-2-2","Buf":"Buf"}] because technically those are 2 commands with one Id. Some commands sent into Serial Port JSON Server get additional commands auto-added. For example, if you send in a command to TinyG that would put it in text mode, SPJS appends a command to put TinyG back in JSON mode. In those cases you will get parts added to your command and will see that in the response.</p>',
            '/getlist' : "In case any other widget/element wants to request the list at any time, they can send a signal to this channel and we'll respond back with a /list",
            '/requestSingleSelectPort' : "In case any other widget/element wants to know what port is single selected (when in setSingleSelectMode()), they can send a signal to this channel and we'll respond back with a /recvSingleSelectPort with an object like: " + JSON.stringify({
                "Name": "COM22",
                "Friendly": "USB Serial Port (COM22)",
                "IsOpen": true,
                "Baud": 115200,
                "RtsOn": true,
                "DtrOn": false,
                "BufferAlgorithm": "tinyg",
                "AvailableBufferAlgorithms": [
                    "default",
                    "tinyg",
                    "dummypause"
                ],
                "Ver": 1.7
            }, undefined, 2) + ". Will send back a null if no ports or no singleSelectPort is defined.",
        },
        foreignPublish: {
            '/com-chilipeppr-elem-flashmsg/flashmsg' : "We publish system messages from the serial port server to the flash message element to display informational messages to the user."
        },
        isWsConnected: false,
        host: null,
        portlist: null,
        conn: null,     // the websocket we're connected to (eventually make this an array so we can have multiple websockets)
        isSingleSelectMode: false,  // means you can multiple open ports, or only open one
        singleSelectPort: null,     // this will get set to the last port opened based on cookie or click
        buffertype: null, // holds what buffertype to request on the "open comPort baud buffertype" command, if null we just don't send
        init: function (host, buffertype) {
            console.group("init of serial port widget");
            // see if we were passed a buffertype
            // this is an extra command now that the serial port json
            // server supports buffer algorithms for specific types
            // of hardware. by default no buffer flow control is needed
            // like if you're controlling an arduino
            // but in the case of tinyg and grbl it helps to have buffer
            // flow be very close to the serial port itself
            // so the serial port json server supports algorithms to be
            // added via github and compiled in. you may request
            // that algorithm here globally, or per serial port
            // it's best to not do this globally since the goal of 
            // chilipeppr is to allow multiple serial port devices at
            // the same time to control things like probes while sending
            // gcode
            if (buffertype != null && buffertype.length > 0) {
                this.buffertype = buffertype;
                console.log("we have a buffertype being requested. buffertype:", this.buffertype);
                // also add extra msg to encourage the buffer choice
                $('.com-chilipeppr-widget-serialport-bufferindicator').removeClass("hidden").find('.buffername').text(buffertype);
            }

            this.btnBarSetup();
            this.consoleSetup();
            this.statusWatcher();
            this.wsConnect(null, host);

            // setup onconnect pubsub event
            chilipeppr.subscribe("/" + this.id + "/ws/onconnect", this, function (msg) {
                this.getPortList();
            });

            // setup recv pubsub event
            // this is when we receive data from the serial port
            chilipeppr.subscribe("/" + this.id + "/ws/recv", this, function (msg) {
                this.onWsMessage(msg);
            });

            // setup low-level send pubsub event
            // this is when a widget sends data to the serial port
            chilipeppr.subscribe("/" + this.id + "/ws/send", this, function (msg) {
                this.wsSend(msg);
            });

            // setup send pubsub event
            // this is when a widget sends data to the serial port
            // this only supports singleSelectMode()
            chilipeppr.subscribe("/" + this.id + "/send", this, function (msg) {
                this.send(msg);
            });

            // setup jsonSend pubsub event
            // this is when a widget sends data to the serial port
            // in a structured way so they can get callbacks
            // this only supports singleSelectMode()
            chilipeppr.subscribe("/" + this.id + "/jsonSend", this, function (json) {
                this.sendViaJson(json);
            });

            // Allow others to request our serial port list
            chilipeppr.subscribe("/" + this.id + "/getlist", this, function () {
                chilipeppr.publish("/" + this.id + "/list", this.portlist);
            });

            var that = this;

            // show last remote host, if there is one
            if ($.cookie('lasthost')) {
                var lasthost = $.cookie('lasthost');
                lasthost = lasthost.replace(/ws:\/\/(.*):.*/, "$1");
                $('#com-chilipeppr-widget-serialport-host').val(lasthost);
            }

            // if connect btn or enter key on remote host connect
            var remoteCon = $('#com-chilipeppr-widget-serialport-hostbtn');
            remoteCon.click(function() {
                that.onRemoteHostConnect();
            });
            $('#com-chilipeppr-widget-serialport-host').keypress(function(event){
                //console.log("got keypress. event:", event);
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if (keycode == '13'){
                    that.onRemoteHostConnect();
                }
            });

            // setup the port scan button
            $('#com-chilipeppr-widget-serialport-scanbtn').click(function() {
                var subnet = $('#com-chilipeppr-widget-serialport-scan').val();
                that.wsScan(null, subnet);
            });

            // cleanup popovers that are getting created by some other widget's code
            //$('.com-chilipeppr-widget-serialport').find('.popover').remove();

            // setup requestSingleSelectPort pubsub event
            chilipeppr.subscribe("/" + this.id + "/requestSingleSelectPort", this, function (msg) {
                this.publishSingleSelectPort();
            });

            // subscribe to our own /onportopen signal to hide the buffer encouragement msg
            chilipeppr.subscribe("/" + this.id + "/onportopen", this.hideBufferEncouragement.bind(this));
            chilipeppr.subscribe("/" + this.id + "/list", this.bufferEncouragement.bind(this));

            console.log(this.name + " done loading.");
            console.groupEnd();
        },
        version: null,
        versionFloat: 0.0,
        onVersion: function(version) {
            console.log("got version cmd. version:", version);
            this.version = version;
            this.versionFloat = parseFloat(version);
            $('.com-chilipeppr-widget-serialport .serial-port-version').text(" v" + version + " ");

            if ( this.versionFloat >= 1.7) {
                $('.com-chilipeppr-widget-serialport-version-yours').text(version);
                $('.com-chilipeppr-widget-serialport-version').addClass('hidden');
            } else if (version == "1.6" || version == "1.2" || version == "1.3" || version == "1.3.1" || version == "1.4" || version == "1.5" || version == "snapshot") {
                $('.com-chilipeppr-widget-serialport-version-yours').text(version);
                //$('.com-chilipeppr-widget-serialport-version').addClass('hidden');
                $('.com-chilipeppr-widget-serialport-version-fullmsg').html(
                        "You are running version " + version + " of the Serial Port JSON Server. You MUST upgrade to the new 1.7 version as the Serial Port JSON Server has moved to a more stuctured send to enable onQueue, onWrite, and OnComplete events.<br/><br/>To upgrade, " +
                        '<button type="button" class="btn btn-xs btn-default disconnect-inline" data-toggle="popover" data-placement="auto" data-container="body" data-content="Disconnect from serial port server" data-trigger="hover" data-original-title="" title=""><span class="glyphicon glyphicon-remove-sign"></span></button>' +
                        " disconnect from the websocket server and click the correct platform to download the binary for.");
                $('.com-chilipeppr-widget-serialport-version-fullmsg .disconnect-inline').click(this.disconnect.bind(this));
                /*
                 } else if (version == "1.2") {
                 $('.com-chilipeppr-widget-serialport-version-fullmsg').html("You are running version 1.2 of the Serial Port JSON Server. If you are running a TinyG, you should upgrade to the new 1.6 version as the Serial Port JSON Server now supports buffer flow control plugins. A plugin has been written for TinyG that puts the control closer to the serial port to ensure no lost Gcode. If you are running an alternate workspace, you're all set, although you could still upgrade.<br/><br/>To upgrade, disconnect from the websocket server and click the correct platform to download the binary for.");
                 */
            } else {
                if (version != null && version != "")
                    $('.com-chilipeppr-widget-serialport-version-yours').text(version);
                $('.com-chilipeppr-widget-serialport-version').removeClass('hidden');
            }
        },
        resetVersion: function() {
            // turn off the version msg in UI
            // to handle earlier versions that don't send a version num
            // default to always showing. then onVersion will hide for us
            $('.com-chilipeppr-widget-serialport-version-yours').text("1.1");
            $('.com-chilipeppr-widget-serialport-version').removeClass('hidden');
        },
        hideVersion: function() {
            $('.com-chilipeppr-widget-serialport-version').addClass('hidden');
        },
        showBufferEncouragement: function() {
            $('.com-chilipeppr-widget-serialport-bufferindicator').removeClass('hidden');
        },
        hideBufferEncouragement: function() {
            $('.com-chilipeppr-widget-serialport-bufferindicator').addClass('hidden');
        },
        bufferEncouragement: function(list, arg2) {
            console.log("got bufferEncouragement port list:", list, "arg2:", arg2);
            //$('.com-chilipeppr-widget-serialport-bufferindicator').addClass('hidden');
            // see if we're being asked to show a default buffer. if we are then we need
            // to analayze the current port list to see if anything is open with that buffer
            // set. if it is we can hide the encouragement msg. if it's not, we should show the msg
            //debugger;
            var that = this;
            if (this.buffertype != null) {
                // yes, the instantiator wants a certain type of buffer to be used
                var isAnythingConnectedWithTheBufferWeWant = false;
                // process whole port list
                list.forEach(function(item) {
                    //debugger;
                    if (item.IsOpen && item.BufferAlgorithm == that.buffertype) {
                        isAnythingConnectedWithTheBufferWeWant = true;
                    }
                });

                if (isAnythingConnectedWithTheBufferWeWant)
                    this.hideBufferEncouragement();
                else
                    this.showBufferEncouragement();
            }
        },
        publishSingleSelectPort: function() {
            console.log("got publishSingleSelectPort. isSingleSelectMode:", this.isSingleSelectMode, "singleSelectPort:", this.singleSelectPort, "portlist:", this.portlist);
            var port = null;
            var that = this;
            if (this.portlist && this.portlist != null) {
                this.portlist.forEach(function(item) {
                    console.log("item:", item);
                    if (item.Name == that.singleSelectPort) {
                        console.log("found it. item.Name:", item.Name);
                        port = item;
                    }
                });
            }
            chilipeppr.publish("/com-chilipeppr-widget-serialport/recvSingleSelectPort", port);
        },
        onRemoteHostConnect: function() {
            var host = $('#com-chilipeppr-widget-serialport-host').val();
            $('#com-chilipeppr-widget-serialport-hostconnectmsg').html(
                    "Trying to connect to " +
                    $('#com-chilipeppr-widget-serialport-host').val() + "...");
            this.wsConnect(host, function() {
                $('#com-chilipeppr-widget-serialport-hostconnectmsg').html("Last connect successful.");
            }, function() {
                $('#com-chilipeppr-widget-serialport-hostconnectmsg').html("Failed to connect to host.");
            });
        },
        setSingleSelectMode: function() {
            this.isSingleSelectMode = true;
            //var ver = " v" + this.version;
            //if (this.version == null) ver = "";
            $('.com-chilipeppr-widget-serialport .panel-heading .subtitle').html('Single Port Mode');
            this.singleSelectPort = $.cookie("singleSelectPort");
            console.log("setSingleSelectMode. port:", this.singleSelectPort);
        },
        getPortListCount: 0,
        getPortList: function () {
            if (this.isWsConnected) {
                this.getPortListCount = 0;
                this.wsSend("list");
            } else {
                if (this.getPortListCount > 5) {
                    // give up, so we don't get in endless loop
                    this.publishSysMsg("Tried to get serial port list, but we are not connected to serial port json server.");
                } else {
                    this.getPortListCount++;
                    this.wsConnect();
                }
            }

        },
        btnBarSetup: function () {
            var that = this;

            /*
             $('.com-chilipeppr-widget-serialport .btn').tooltip({
             animation: true,
             delay: 100,
             //container: 'body'
             });
             */
            $('.com-chilipeppr-widget-serialport .btn').popover({
                animation: true,
                delay: 100,
                //container: 'body'
            });

            $('.com-chilipeppr-widget-serialport .btn.refresh').click(function () {
                $('.com-chilipeppr-widget-serialport-disconnected .refresh').prop('disabled', true);
                that.getPortList();
            });
            $('#com-chilipeppr-widget-serialport-tbar-showhideconsole').click(
                this.consoleToggle.bind(this)
            );
            $('#com-chilipeppr-widget-serialport-tbar-showhidestatus').click(
                this.statusToggle.bind(this)
            );
            $('#com-chilipeppr-widget-serialport-tbar-refresh').click(function () {
                that.getPortList();
            });
            $('#com-chilipeppr-widget-serialport-tbar-reconws').click(function () {
                that.wsConnect();
            });
            $('#com-chilipeppr-widget-serialport-tbar-disconws').click(this.disconnect.bind(this));
            $('.com-chilipeppr-widget-serialport .btn.disconnect').click(this.disconnect.bind(this));

            this.forkSetup();

        },
        disconnect: function() {
            console.log("closing websocket:", this.conn);
            if (this.conn) {
                this.conn.close();
                $('.com-chilipeppr-widget-serialport-install').removeClass('hidden');
            }
        },
        consoleToggle: function() {
            var con = $('.com-chilipeppr-widget-serialport-console');
            var coni = $('.com-chilipeppr-widget-serialport-consoleinput');
            if (con.hasClass('hidden')) {
                // the console is hidden, so let's show
                con.removeClass('hidden');
                coni.removeClass('hidden');
                this.logIsShowing = true;
            } else {
                // it's showing, so they want to hide it
                con.addClass('hidden');
                coni.addClass('hidden');
                this.logIsShowing = false;
            }

        },
        statusToggle: function() {
            var stat = $('.com-chilipeppr-widget-serialport-status');
            if (stat.hasClass('hidden')) {
                // the status is hidden, so let's show
                stat.removeClass('hidden');
            } else {
                // it's showing, so they want to hide it
                stat.addClass('hidden');
            }
        },
        history: [], // store history of commands so user can iterate back
        historyLastShownIndex: null,    // store last shown index so iterate from call to call
        pushOntoHistory: function(cmd) {
            this.history.push(cmd);

            // push onto dropup menu
            //var el = $('<li><a href="javascript:">' + cmd + '</a></li>');
            //$('#com-chilipeppr-widget-spconsole-consoleform .dropdown-menu').append(el);
            //el.click(cmd, this.onHistoryMenuClick.bind(this));
        },
        onHistoryMenuClick: function(evt) {
            console.log("got onHistoryMenuClick. data:", evt.data);
            $("#com-chilipeppr-widget-spconsole-consoleform input").val(evt.data);
            //return true;
        },
        consoleSetup: function () {
            // subscribe to websocket events
            chilipeppr.subscribe("/" + this.id + "/ws/recv", this, function (msg) {
                var msg = $("<div/>").text(msg);
                this.appendLog(msg);
            });

            var that = this;
            $("#com-chilipeppr-widget-serialport-consoleform").submit(function (evt) {
                evt.preventDefault();

                console.log("got submit on form");
                if (!that.isWsConnected) {
                    return false;
                }
                var msg = $('#com-chilipeppr-widget-serialport-consoleform input');
                if (!msg.val()) {
                    return false;
                }

                // push onto history stack
                if (msg.val().length > 0) {
                    //console.log("pushing msg to history. msg:", msg.val());
                    that.pushOntoHistory(msg.val());

                }

                //that.wsSend(msg.val() + "\n");
                //that.send(msg.val() + "\n");
                //that.sendBuffered(msg.val() + "\n");
                that.sendFromConsole(msg.val() + "\n");
                that.appendLogEchoCmd(msg.val());
                msg.val("");

                // reset history on submit
                that.historyLastShownIndex = null;

                return false;
            });

            // show history by letting user do up/down arrows
            $("#com-chilipeppr-widget-serialport-consoleform").keydown(function(evt) {
                //console.log("got keydown. evt.which:", evt.which, "evt:", evt);
                if (evt.which == 38) {
                    // up arrow
                    if (that.historyLastShownIndex == null)
                        that.historyLastShownIndex = that.history.length;
                    that.historyLastShownIndex--;
                    if (that.historyLastShownIndex < 0) {
                        console.log("out of history to show. up arrow.");
                        that.historyLastShownIndex = 0;
                        return;
                    }
                    $("#com-chilipeppr-widget-serialport-consoleform input").val(that.history[that.historyLastShownIndex]);
                } else if (evt.which == 40) {
                    if (that.historyLastShownIndex == null)
                        return;
                    //that.historyLastShownIndex = -1;
                    that.historyLastShownIndex++;
                    if (that.historyLastShownIndex >= that.history.length) {
                        console.log("out of history to show. down arrow.");
                        that.historyLastShownIndex = that.history.length;
                        $("#com-chilipeppr-widget-serialport-consoleform input").val("");
                        return;
                    }
                    $("#com-chilipeppr-widget-serialport-consoleform input").val(that.history[that.historyLastShownIndex]);
                }
            });


        },
        log: null,
        logIsShowing: false,
        appendLogOld: function (msg) {
            // don't do this if log not showing
            if (!this.logIsShowing) {
                //console.log("being asked to append, but log is not showing. exiting.");
                return;
            }

            if (this.log == null) this.log = $('.com-chilipeppr-widget-serialport-console-log');
            var log = this.log;
            var d = log[0];
            var doScroll = d.scrollTop == d.scrollHeight - d.clientHeight;
            // see if log is too long
            if (log.text().length > 5000) {
                // truncating log
                console.log("Truncating log.");
                log.text(log.text().substring(log.text().length-2500));
            }
            msg.appendTo(log);
            if (doScroll) {
                d.scrollTop = d.scrollHeight - d.clientHeight;
            }
        },
        appendLogEchoCmd: function(msg) {
            //console.log("appendLogEchoCmd. msg:", msg);
            var msg2 = $("<div class=\"out\"/>").text("" + msg);
            //console.log(msg2);
            this.appendLog(msg2);
        },
        logEls: {
            log: null,
            logOuter: null,
        },
        appendLog: function (msg) {
            // don't do this if log not showing
            if (!this.logIsShowing) {
                //console.log("being asked to append, but log is not showing. exiting.");
                return;
            }
            //console.log("appendLog. msg:", msg);
            if (this.logEls.log == null) {
                console.log("lazy loading logEls. logEls:", this.logEls);
                this.logEls.log = $('.com-chilipeppr-widget-serialport-console-log pre');
                this.logEls.logOuter = $('.com-chilipeppr-widget-serialport-console-log');
            }
            //console.log("logEls:", this.logEls);
            //console.log(this.logEls.logOuter);
            var d = this.logEls.logOuter[0];
            var doScroll = d.scrollTop == d.scrollHeight - d.clientHeight;
            var log = this.logEls.log;
            if (log.html().length > 50000) {
                // truncating log
                console.log("Truncating log.");
                /*
                 var logHtml = log.html().split(/\n/);
                 var sliceStart = logHtml.length - 200;
                 if (sliceStart < 0) sliceStart = 0;
                 log.html(logHtml.slice(sliceStart).join("\n"));
                 */
                var loghtml = log.html();
                log.html("--truncated--" + loghtml.substring(loghtml.length - 2500));
            }
            if (msg.appendTo)
                msg.appendTo(log);
            else
                log.html(log.html() + msg);

            //if (doScroll) {
            d.scrollTop = d.scrollHeight - d.clientHeight;
            //}
        },
        // TODO: Make all buffered sending work on multiple ports. For now it's just single select port.
        sendbuf: [],
        isSendBufWaiting: false, // true if we're waiting for "Queue" response
        sendBuffered: function(msg) {

            // in this method we'll queue to an array and then work the array when we see a WriteQueuedBuffered back
            console.log("inside sendBuffered. msg:", msg);

            // push msg onto stack
            this.sendbuf.push(msg);

            // only trigger buffer send if we aren't waiting
            setTimeout(this.sendBufferedDoNext.bind(this), 1);

        },
        sendBufferedDoNext: function() {

            if (this.sendbuf.length == 0) {
                console.log("no more items on buffer so exiting and not queuing for next");
                this.appendLog("(No more items on buffer.)");
                return;
            }

            if (this.isSendBufWaiting) {
                console.log("isSendBufWaiting is true, so returning.");
                return;
            }

            var msg = this.sendbuf.join("");
            this.sendbuf = []; // clear buffer to empty array
            console.log("sendBufferedDoNext. full join of buf. msg:", msg);
            /*
             // shift off of the sendbuf queue
             var msg = this.sendbuf.shift();
             console.log("sendBufferedDoNext. msg:", msg);
             */

            if (this.isSingleSelectMode) {
                if (this.singleSelectPort != null && this.singleSelectPort.length > 1) {

                    console.log("setting isSendBufWaiting to true. sending to port:", this.singleSelectPort, "msg:", msg);
                    msg = "send " + this.singleSelectPort + " " + msg;
                    this.isSendBufWaiting = true; // make sure we wait
                    this.wsSend(msg);

                } else {
                    this.publishSysMsg("Tried to send a serial port message, but there is no port selected.");
                }
            } else {
                this.publishSysMsg("Not in single select mode so don't know what port to send to.");
            }

            // subscribe to /recv pubsub response to wait until we see a queue buffered response

            // otherwise send off
            //this.send(msg);

            // then call next item without using stack and tiny yield
            //setTimeout(this.sendBufferedDoNext.bind(this), 1); // 1 ms
        },
        sendBufferedOnWsRecv: function(data) {
            console.log("got sendBufferedOnWsRecv. setting isSendBufWaiting to false. data:", data);
            this.isSendBufWaiting = false; // mark to false cuz if we're queued we can now move forward
            setTimeout(this.sendBufferedDoNext.bind(this), 1); // 1 ms
        },
        // TODO: Make all json buffered sending work on multiple ports. For now it's just single select port.
        sendbufjson: [],
        isSendBufWaitingJson: false, // true if we're waiting for "Queue" response
        sendBufferedJson: function(msg) {

            // in this method we'll queue to an array and then work the array when we see a WriteQueuedBuffered back
            console.log("inside sendBufferedJson. msg:", msg);

            // push msg onto stack
            this.sendbufjson.push(msg);

            // only trigger buffer send if we aren't waiting
            setTimeout(this.sendBufferedDoNextJson.bind(this), 1);

        },
        sendBufferedDoNextJson: function() {
            console.group("serial port widget - sendBufferedDoNextJson");
            if (this.sendbufjson.length == 0) {
                console.log("no more items on json buffer so exiting and not queuing for next");
                this.appendLog("(No more items on json buffer.)");
                console.groupEnd();
                return;
            }

            if (this.isSendBufWaitingJson) {
                console.log("isSendBufWaitingJson is true, so returning.");
                console.groupEnd();
                return;
            }

            //var msg = this.sendbufjson.join("");
            //console.log("sendBufferedDoNextJson. full join of buf. msg:", msg);

            if (this.isSingleSelectMode) {
                if (this.singleSelectPort != null && this.singleSelectPort.length > 1) {

                    console.log("setting isSendBufWaitingJson to true. sending to port:", this.singleSelectPort);

                    var payload = {
                        P: this.singleSelectPort,
                        Data: this.sendbufjson
                    }
                    // TODO: GET IN CORRECT FORMAT
                    msg = "sendjson " + JSON.stringify(payload);
                    this.isSendBufWaitingJson = true; // make sure we wait
                    this.wsSend(msg);

                } else {
                    this.publishSysMsg("Tried to send a serial port message, but there is no port selected.");
                }
            } else {
                this.publishSysMsg("Not in single select mode so don't know what port to send to.");
            }

            this.sendbufjson = []; // clear buffer to empty array
            console.groupEnd();
        },
        sendBufferedOnWsRecvJson: function(data) {
            console.log("got sendBufferedOnWsRecvJson. setting isSendBufWaitingJson to false. data:", data);
            this.isSendBufWaitingJson = false; // mark to false cuz if we're queued we can now move forward
            setTimeout(this.sendBufferedDoNextJson.bind(this), 1); // 1 ms
        },
        sendFromConsole: function(msg) {
            this.wsSend(msg);
        },
        sendViaJson: function(json) {
            console.group("serial port widget - sendViaJson");

            // we should be passed json that looks like
            //  {"D": "G0 X1\n", "Id":"123"} 
            // ensure it can be parsed
            if ("D" in json) {
                // we are good
                // push msg onto stack
                this.sendbufjson.push(json);

                // only trigger buffer send if we aren't waiting
                setTimeout(this.sendBufferedDoNextJson.bind(this), 1);
            } else if (Array.isArray(json)) {
                // its an array of commands
                this.sendbufjson = this.sendbufjson.concat(json);
                // only trigger buffer send if we aren't waiting
                setTimeout(this.sendBufferedDoNextJson.bind(this), 1);
            } else {
                console.error("Sent incorrectly formatted object. You must provide the D parameter in your object to send commands to the serial port via JSON.");

            }

            console.groupEnd();
        },
        onQueuedJson: function(data) {
            // we got a queued msg. good. fire off event
            console.group("serial port widget - onQueuedJson");

            // tell the json buffer it can send the next command
            this.sendBufferedOnWsRecvJson();

            console.log("data:", data);
            //var json = $.parseJSON(data);
            //console.log("parsed:", json);
            for (var ctr = 0; ctr < data.Data.length; ctr++) {
                var payload = {
                    Id: data.Data[ctr].Id,
                    Buf: data.Data[ctr].Buf
                    //Parts: data.Data[ctr].Parts 
                };
                if ('D' in data.Data[ctr]) payload["D"] = data.Data[ctr].D;
                chilipeppr.publish("/" + this.id + "/onQueue", payload);
            }
            console.groupEnd();
        },
        onQueuedText: function(data) {
            // we got a queued msg. good. fire off event
            console.group("serial port widget - onQueuedText");

            // tell the buffer it can send the next command
            this.sendBufferedOnWsRecv();

            if (this.versionFloat >= 1.7) {

                console.log("data:", data);
                //var json = $.parseJSON(data);
                //console.log("parsed:", json);
                for (var ctr = 0; ctr < data.D.length; ctr++) {
                    var payload = {
                        Id: data.Ids[ctr],
                        Buf: data.Type[ctr]
                    }
                    if ('D' in data) payload["D"] = data.D[ctr];
                    chilipeppr.publish("/" + this.id + "/onQueue", payload);
                }
            } else {
                console.log("not running 1.7 or later of SPJS. your version:", this.versionFloat);
            }
            console.groupEnd();
        },
        onWriteJson: function(data) {
            // we got a write msg. good. fire off event
            console.group("onWriteJson");
            console.log("data:", data);
            var payload = { Id: data.Id };
            chilipeppr.publish("/" + this.id + "/onWrite", payload);
            console.groupEnd();
        },
        onCompleteJson: function(data) {
            // we got a complete msg. good. fire off event
            console.group("onCompleteJson");
            console.log("data:", data);
            var payload = { Id: data.Id };
            chilipeppr.publish("/" + this.id + "/onComplete", payload);
            console.groupEnd();
        },
        send: function(msg) {
            // this method is called when we get a publish on our pubsub channel of /send
            /*
             if (this.version != null && this.versionFloat >= 1.7) {
             // we have a modern spjs that supports buffering
             //console.log("using new sendBuffered")
             this.sendBufferedJson(msg);
             } else if (this.version != null && this.versionFloat >= 1.4) {
             */
            if (this.version != null && this.versionFloat >= 1.4) {
                // we have a modern spjs that supports buffering
                //console.log("using new sendBuffered")
                this.sendBuffered(msg);
            } else {
                // we have old server, send as before
                //console.log("using old sendNoBuf(). msg:", msg);
                this.sendNoBuf(msg);
            }
        },
        sendNoBuf: function(msg) {
            // this was called send() before, but rewrote it to branch if we have a later version of
            // serial port json server that allows buffering

            // we have to figure out what port to send to which depends on whether we're in multi mode or single mode
            var listOfPortsToSendTo = [];

            if (this.isSingleSelectMode) {
                if (this.singleSelectPort != null && this.singleSelectPort.length > 1)
                    listOfPortsToSendTo.push(this.singleSelectPort);
                else
                    this.publishSysMsg("Tried to send a serial port message, but there is no port selected.");

            } else {
                // TODO push open ports onto array instead
            }
            var that = this;
            $.each(listOfPortsToSendTo, function(i, port) {
                console.log("sending to port:", port, "msg:", msg);
                msg = "send " + port + " " + msg;
                that.wsSend(msg);
            });

        },
        wsSend: function (msg) {
            if (this.isWsConnected) {
                this.conn.send(msg);
            } else {
                this.publishSysMsg("Tried to send message, but we are not connected to serial port ajax server.");
            }
        },
        serialSaveCookie: function(portname, baud, isrts, isdtr, buffer) {
            /*var settings = '{ "baud" : ' + baud + ',' +
             ' "isRts" : ' + isrts + ',' +
             ' "isDtr" : ' + isdtr + ' }';*/
            var settings = JSON.stringify({ baud:baud, isRts:isrts, isDtr:isdtr, buffer:buffer });

            // store our port/baud settings in cookie for convenience
            $.cookie('port-' + portname, settings, {
                expires: 365,
                path: '/'
            });

        },
        serialGetCookie: function(portname) {
            // get cookies that may have been stored for the previous settings
            // of the baud, rts, dtr settings
            // make sure we loaded jquery.cookie plugin
            var settings = $.cookie('port-' + portname);
            //console.log("getCookie:", settings);
            if (settings) {
                settings = $.parseJSON(settings);
                //console.log("just evaled settings: ", settings);
            }
            return settings;
        },
        serialConnect: function (portname, baud, buffer) {

            // reset the sendBuffer waiting flag cuz state unknown now
            this.isSendBufWaiting = false;
            this.isSendBufWaitingJson = false;

            // save the cookie for future convenience so we can load the baud and other stuff
            // so the user can be lazy
            this.serialSaveCookie(portname, baud, null, null, buffer);

            // if we are not ajax server connected, try to reconnect
            var that = this;
            var buf = "";
            if (buffer != null && buffer.length > 0)
                buf = " " + buffer;

            /*
             if (that.buffertype == null)
             buf = "";
             else
             buf = " " + that.buffertype; // add space for after baud
             */

            if (!this.isWsConnected) {
                this.wsConnect(function () {
                    chilipeppr.publish("/" + that.id + "/ws/send",
                            "open " + portname + " " + baud + buf);
                });
            } else {
                chilipeppr.publish("/" + this.id + "/ws/send",
                        "open " + portname + " " + baud + buf);
            }
        },
        serialDisconnect: function (portname) {

            // if we are not ajax server connected, try to reconnect
            var that = this;
            if (!this.isWsConnected) {
                this.wsConnect(function () {
                    chilipeppr.publish("/" + that.id + "/ws/send",
                            "close " + portname);
                });
            } else {
                chilipeppr.publish("/" + this.id + "/ws/send",
                        "close " + portname);
            }
        },
        reconMsgShow: function() {
            $('.com-chilipeppr-widget-serialport-disconnected').removeClass('hidden');
            // undisable the reconnect btn
            $('.com-chilipeppr-widget-serialport-disconnected .refresh').prop('disabled', false);
        },
        reconMsgHide: function() {
            $('.com-chilipeppr-widget-serialport-disconnected').addClass('hidden');
        },
        wsWasEverConnected: false,
        wsConnect: function (hostname, onsuccess, onfail) {
            // since we are newly connecting, hide version UI (it will reshow after connect)
            this.resetVersion();

            // reset the sendBuffer waiting flag cuz state unknown now
            this.isSendBufWaiting = false;

            if (window["WebSocket"]) {
                var host = hostname;
                if (!host) {
                    // see if cookie
                    if ($.cookie('lasthost')) {
                        console.log("there is a previous hostname. use it.", $.cookie('lasthost'));
                        host = $.cookie('lasthost');
                    } else {
                        host = "localhost";
                    }
                }
                var fullurl;
                if (host.match(/^ws/))
                    fullurl = host;
                else if (host.match(/:\d+$/))
                    fullurl = "ws://" + host + "/ws";
                else
                    fullurl = "ws://" + host + ":8989/ws";
                this.conn = new WebSocket(fullurl);
                console.log(this.conn);
                var that = this;
                that.conn.onopen = function (evt) {
                    that.wsWasEverConnected = true;
                    that.reconMsgHide();
                    that.onWsConnect(evt);
                    $.cookie('lasthost', that.conn.url, {
                        expires: 365,
                        path: '/'
                    });
                    if (onsuccess) onsuccess.apply(that);
                };
                that.conn.onerror = function (evt) {
                    console.log(evt);
                    that.publishSysMsg("Serial port ajax error.");
                    if (onfail) onfail.apply(that);
                };
                that.conn.onclose = function (evt) {
                    if (that.wsWasEverConnected) that.reconMsgShow();
                    that.onWsDisconnect(evt);
                }
                that.conn.onmessage = function (evt) {
                    that.publishMsg(evt.data);
                };
            } else {
                this.publishSysMsg("Your browser does not support WebSockets.");
            }
        },
        wsScan: function (callback, subnet) {
            // this method will scan your local subnet
            // for hosts
            if (window["WebSocket"]) {
                console.log("starting scan of network for serial port servers...");
                var validAddrs = [];
                var that = this;
                if (subnet)
                    subnet = subnet.replace("*", "");
                else
                    subnet = "192.168.1.";
                var scancntsuccess = 0;
                var scancnterr = 0;
                var cnt = $('#com-chilipeppr-widget-serialport-scanresultcnt');
                cnt.text("Starting scan of " + subnet + "*");
                $('#com-chilipeppr-widget-serialport-scanresult').html("");
                for (var ctr = 1; ctr < 255; ctr++) {
                    var conn = new WebSocket("ws://" + subnet + ctr + ":8989/ws");
                    conn.onopen = function (evt) {
                        scancntsuccess++;
                        console.log("found a server. ip:", evt.target.url, evt);
                        validAddrs.push(evt.target);
                        console.log("found one:", validAddrs);
                        var server = $("<div><a href=\"javascript:\">" + evt.target.url + "</a></div>");
                        server.click(evt.target.url, function(evt) {
                            console.log("got click. evt:", evt, "data:", evt.data);
                            that.wsConnect(evt.data);
                        });
                        $('#com-chilipeppr-widget-serialport-scanresult').append(server);
                    };
                    conn.onerror = function(evt) {
                        scancnterr++;
                        //console.log("error opening url:", evt.target.url, evt);

                        cnt.text("Found " + scancntsuccess + ", Scanned " + (scancntsuccess + scancnterr));
                    };
                };
                //console.log("done scanning network. found:", validAddrs);
                return validAddrs;
            }
        },
        lastMsg: null,
        lastMsgTime: 0,
        publishSysMsg: function (msg) {
            chilipeppr.publish("/" + this.id + "/ws/sys", msg);
            var now = Date.now();
            if (this.lastMsg == msg && now - this.lastMsgTime < 20000) {
                // skip publish
                console.log("skipping publish. same msg or too fast.");
            } else {
                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "Serial Port System Message", msg);
                this.lastMsg = msg;
                this.lastMsgTime = now;
            }
        },
        publishMsg: function (msg) {
            chilipeppr.publish("/" + this.id + "/ws/recv", msg);
        },
        dataBuffer: {},
        onWsMessage: function (msg) {
            //console.log("inside onWsMessage. msg: " + msg);
            if (msg.match(/^\{/)) {
                // it's json
                //console.log("it is json");
                var data = null;
                //try {
                data = $.parseJSON(msg);
                /*
                 } catch (e) {
                 // error
                 console.log("got error parsing json from CNC controller. msg:", msg);
                 // try some cleanup based on some anomalies we've seen
                 msg = msg.replace(/\{"sr"\{"sr"\:/, '{"sr":');
                 msg = msg.replace(/\{"r"\{"sr"\:/, '{"sr":');
                 data = $.parseJSON(msg);
                 }
                 */
                if (data && data.Cmd && data.Cmd == "OpenFail") {
                    // we tried to open the serial port, but it failed. usually access denied.
                    this.onPortOpenFail(data);
                } else if (data && data.Cmd && data.Cmd == "Open") {
                    // the port was opened, possibly by other browser or even locally from sys tray
                    this.onPortOpen(data);
                } else if (data && data.Cmd && data.Cmd == "Close") {
                    // the port was closed, possibly by other browser or even locally from sys tray
                    this.onPortClose(data);
                } else if (data && data.Cmd && data.Cmd == "Queued") {
                    // we need to watch for queues being done so we know to send next
                    // is it a json queued response or text mode queued response
                    if ("Data" in data) {
                        // it is a json mode response
                        this.onQueuedJson(data);
                    } else {
                        this.onQueuedText(data);
                        //this.sendBufferedOnWsRecv(data);
                    }
                    // update prog bar of buffer
                    this.onUpdateQueueCnt(data);
                } else if (data && data.Cmd && data.Cmd == "Write") {
                    // update prog bar of buffer. this would decrement prog bar cuz a dequeue happened
                    // see if we have an Id resposne, if so it is from
                    // a json send and we need to see the response
                    if ("Id" in data) {
                        this.onWriteJson(data);
                    }
                    this.onUpdateQueueCnt(data);
                } else if (data && data.Cmd && (data.Cmd == "Complete" || data.Cmd == "CompleteFake")) {
                    this.onCompleteJson(data);

                } else if (data && data.SerialPorts) {
                    // we got a serial port list
                    console.log("got serial port list");
                    console.log(data);
                    this.onPortList(data.SerialPorts);
                } else if (data && data.Version) {
                    this.onVersion(data.Version);
                } else if (data && data.P && data.D) {

                    // we got actual raw serial port data
                    // we need to parse into newlines and buffer
                    // for the next time we get here and only fire off
                    // a publish per newline

                    if (this.isSingleSelectMode && this.singleSelectPort == data.P) {

                        //console.log("this:", this);
                        //console.log("dataBuffer:", this.dataBuffer);
                        //console.log("p:", data.P, "d:", data.D);
                        //console.log(this.dataBuffer[data.P]);
                        if(!(data.P in this.dataBuffer))
                            this.dataBuffer[data.P] = data.D;
                        else
                            this.dataBuffer[data.P] += data.D;
                        //console.log(this.dataBuffer[data.P]);
                        //console.log("dataBuffer:", this.dataBuffer);

                        //var portBuf = this.dataBuffer[data.P];

                        // see if we got newline
                        while (this.dataBuffer[data.P].match(/\n/)) {
                            //console.log("we have a newline.");
                            var tokens = this.dataBuffer[data.P].split(/\n/);
                            var line = tokens.shift() + "\n";
                            this.dataBuffer[data.P] = tokens.join("\n");
                            //console.log("publishing line:", line);
                            //console.log("new buffer:", this.dataBuffer[data.P], "len:", this.dataBuffer[data.P].length);

                            // do some last minute cleanup
                            // THIS IS NOT GOOD, BUT SEEING TINYG SHOWING BAD DATA
                            // THIS IS ALSO NOT THE RIGHT SPOT SINCE THIS SERIAL PORT WIDGET IS SUPPOSED
                            // TO BE GENERIC. Remove when TinyG has no problems.
                            line = line.replace(/\{"sr"\{"sr"\:/, '{"sr":');
                            line = line.replace(/\{"r"\{"sr"\:/, '{"sr":');

                            chilipeppr.publish("/" + this.id + "/recvline", {
                                ws: this.conn.url,
                                port: data.P,
                                dataline: line
                            });

                        }
                    } else {
                        console.log("have a /recvline to publish, but since in single select mode we don't have a match to the selected port so ignoring.");
                    }

                }

            } else if (msg.match(/We could not find the serial port/)) {
                // kind of a hack to send publishSysMsg when we get this
                // the serial-port-json-server should be changed to send this as json
                this.publishSysMsg(msg);
            }
        },
        onPortOpen: function(data) {
            console.group("onPortOpen");
            console.log("Open a port: ", data, data.Port);
            var portname = data.Port;
            // swap back weird characters
            portname = this.toSafePortName(portname);
            console.log("got onPortOpen. portname to use for dom lookups:", portname);
            $('#' + portname + "Cb").prop('checked', true);
            $('#' + portname + "Row .glyphicon-exclamation-sign").addClass("hidden");
            if (this.isSingleSelectMode) {
                console.log("got port open but in single select mode.");
                // hilite this port
                $('.com-chilipeppr-widget-serialport-portlist > tbody > tr').removeClass("success");
                $('#' + portname + "Row").addClass("success");
                this.singleSelectPort = data.Port;
                // save cookie, but let path be to this workspace so other workspaces using this
                // widget leave their own default last singleSelectPort
                $.cookie("singleSelectPort", data.Port, { expires: 365 * 10 });
            }

            // publish /ws/onconnect
            chilipeppr.publish('/' + this.id + '/ws/onconnect', data);

            // publish /onportopen
            chilipeppr.publish('/' + this.id + '/onportopen', data);
            console.groupEnd();

        },
        onPortClose: function(data) {
            console.log("Close a port: ", data, data.Port);
            var portname = data.Port;
            portname = this.toSafePortName(portname);
            $('#' + portname + "Cb").prop('checked', false);
            $('#' + portname + "Row .glyphicon-exclamation-sign").addClass("hidden");

            // publish /onportclose
            chilipeppr.publish('/' + this.id + '/onportclose', data);
        },
        onPortOpenFail: function(data) {
            console.log("Opening a port failed: ", data, data.Port);
            var portname = data.Port;
            portname = this.toSafePortName(portname);
            $('#' + portname + "Cb").prop('checked', false);
            //$('#' + portname + "Row .glyphicon-exclamation-sign").prop("title", data.Desc);
            $('#' + portname + "Row .glyphicon-exclamation-sign").removeClass("hidden");
            $('#' + portname + "Row .glyphicon-exclamation-sign").tooltip({
                title: data.Desc,
                animation: true,
                delay: 100,
                container: 'body'
            });
            // publish /onportopenfail
            chilipeppr.publish('/' + this.id + '/onportopenfail', data);
        },
        toSafePortName: function(portname) {
            // we need to convert vals that could show up in the port name
            // with vals that are safe to use in the DOM as id's
            portname = portname.replace(/\//g, "-fslash-");
            portname = portname.replace(/\./g, "-dot-");
            return portname;
        },
        fromSafePortName: function(safeportname) {
            safeportname = safeportname.replace(/-fslash-/g, "/");
            safeportname = safeportname.replace(/-dot-/g, ".");
            return safeportname;
        },
        queueMax: {}, // stores max vals we've seen
        queueEls: {}, // stores dom elements so don't have to look up each time
        onUpdateQueueCnt: function(data) {
            // we'll get json like this so we know our buffer state in spjs
            // {"Cmd":"Queued","QCnt":6,"Type":["Buf","Buf","Buf","Buf","Buf"],...,"Port":"COM22"}

            console.log("got onUpdateQueueCnt. data:", data);
            var port = data.Port;
            if ('P' in data) port = data.P;
            var i = this.toSafePortName(port);
            if (data.Cmd == "Queued" || data.Cmd == "Write") {
                var val = data.QCnt;

                // recalc max value
                if (!(i in this.queueMax) || this.queueMax[i] < val) {
                    this.queueMax[i] = val;
                    $('#' + i + "BufferProgBar").attr('aria-valuemax', val);
                }
                var valpct = (val / this.queueMax[i]) * 100;
                $('#' + i + "BufferProgBar").css('width', valpct+'%').attr('aria-valuenow', val).parent().removeClass("hidden");
                var color = "white";
                if (valpct < 30.0) color = "black";
                $('#' + i + "BufferProgBar span").text(val).css('color', color);
            }
        },
        isInitting: true, // the first time thru onPortList assume we are in initting mode because SPJS may already be connected to a port and if so we want to publish signals to other widgets indicating so
        onPortList: function (portlist) {
            console.group("serial port widget onPortList");
            //console.log("inside onPortList");
            var html = "";
            var htmlFirst = ""; // show the connected ports first in the HTML
            var that = this;
            this.portlist = portlist;
            // publish the port list for other listeners
            chilipeppr.publish("/com-chilipeppr-widget-serialport/list", portlist);
            // now build the UI
            if (portlist.length > 0) {
                $.each(portlist, function (i, item) {
                    console.log("looping thru ports. item:", item);
                    var rowClass = "";
                    if (item.Name == that.singleSelectPort) {
                        rowClass = "success";
                    }
                    var i = item.Name;
                    i = that.toSafePortName(i);
                    console.log("the port name we will use is:", i);

                    // create available algorithms dropdown
                    var availArgsHtml = "";
                    if ('AvailableBufferAlgorithms' in item) {
                        // we are on a version of the server that gives us this
                        availArgsHtml = "<td><select id=\"" + i + "Buffer\" class=\"com-chilipeppr-widget-serialport-buffer\" class=\"form-control\">";
                        //availArgsHtml += "<option></option>"
                        item.AvailableBufferAlgorithms.forEach(function(alg) {
                            //console.log("algorithm:", alg);
                            availArgsHtml += "<option value=\"" + alg + "\">" + alg + "</option>";
                        });
                        availArgsHtml += "</select></td>";
                    }

                    var row = "<tr id=\"" + i + "Row\" class=\"" + rowClass + "\"><td>" +
                        "<input id=\"" + i + "Cb\" type=\"checkbox\" /> <span class=\"glyphicon glyphicon-exclamation-sign text-danger hidden\" data-toggle=\"tooltip\" data-placement=\"auto\"></span>" +
                        "</td><td id=\"" + i + "Friendly\" style=\"cursor:pointer;\">" + item.Friendly + "</td>" +
                        availArgsHtml +
                        "<td><select id=\"" + i + "Baud\" class=\"com-chilipeppr-widget-serialport-baud\" class=\"form-control\">" +
                        that.getBaudRates() +
                        "</select></td>" +

                        "</tr>";
                    if ('IsOpen' in item && item.IsOpen == true)
                        htmlFirst += row;
                    else
                        html += row;
                });
            } else {
                // no serial ports in list
                html = '<div class="alert alert-danger" style="margin-bottom:0;">No serial ports found on your Serial Port JSON Server.</div>';
            }
            html = htmlFirst + html;
            $('.table.com-chilipeppr-widget-serialport-portlist tbody').html(html);

            $.each(portlist, function (i, item) {
                // now set the values from the cookie so we make their life easier
                var cookie = that.serialGetCookie(item.Name);
                //console.log("got cookie for ", item.Name, " cookie:", cookie);
                //console.log(cookie.baud);

                var i = that.toSafePortName(item.Name);

                if (cookie && cookie.baud) {
                    // choose baud stored in the cookie
                    $('#' + i + "Baud").val(cookie.baud);
                }
                // now set the values for the bufferflow
                if (cookie && cookie.buffer) {
                    // choose baud stored in the cookie
                    $('#' + i + "Buffer").val(cookie.buffer);
                }

                // we may have set the default vals from the cookie, but now override
                // based on what the serial port server has open and what those settings are
                if (item.IsOpen) {
                    $('#' + i + "Cb").prop('checked', item.IsOpen);
                    // choose baud it was opened at
                    $('#' + i + "Baud").val(item.Baud);
                    // choose buffer it was opened as
                    $('#' + i + "Buffer").val(item.BufferAlgorithm);
                    // lock pulldown
                    $('#' + i + "Buffer").prop("disabled", true);
                    //debugger;
                    // see if open as a true buffer and then add a buffer bar
                    if (that.versionFloat >= 1.4) {
                        console.log("adding buffer bar");
                        $('#' + i + "Buffer").parent().append(
                                '<div class="progress hidden">' +
                                '<div id="' + i + 'BufferProgBar" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="10" style="width: 80%;">' +
                                '    <span class="" style="min-width:20px;padding-left:3px;">Unknown</span>' +
                                '</div>' +
                                '</div>');
                    }

                    // if isInitting then fire off fake onportopen signals
                    // as if user just opened this port
                    if (that.isInitting) {
                        chilipeppr.publish("/com-chilipeppr-widget-serialport/onportopen", item);
                    }
                }

                // set default buffer based on what was set (if anything) in this.bufferType
                // but only do it if item is not open and there's no cookie
                if (item.IsOpen == false && cookie && !('buffer' in cookie) && that.buffertype != null) {
                    console.log("setting default buffer type cuz item not open, no cookie, and is a default buf type. item:", item);
                    $('#' + i + "Buffer").val(that.buffertype);
                }

                // pass my item inside the data val on the click event
                $('#' + i + "Cb").click({that:that,port:item}, that.onPortCbClicked);
                $('#' + i + "Friendly").click({that:that,port:item}, that.onPortFriendlyClicked);
            });

            // set isInitting to false, that means only the 1st time
            // thru this method will we do any isInitting code
            if (that.isInitting) {
                console.log("setting isInitting to false so don't run init code again on port list");
                that.isInitting = false;
            }
            console.groupEnd();

        },
        onPortFriendlyClicked: function(evt) {
            console.log("got onPortFriendlyClicked: ", evt);
            var item = evt.data.port;
            var that = evt.data.that;
            var isSelected = false;
            var i = that.toSafePortName(item.Name);
            if ($('#' + i + "Cb").is(":checked")) isSelected = true;
            if (isSelected) {
                // then we want to close, so uncheck
                $('#' + i + "Cb").prop('checked', false);
            } else {
                $('#' + i + "Cb").prop('checked', true);
            }
            // call the checkbox click event as if we had clicked it
            that.onPortCbClicked(evt);
        },
        onPortCbClicked: function(evt) {
            console.log("got onPortClicked: ", evt);
            var item = evt.data.port;
            var that = evt.data.that;
            console.log(item);
            // see if selected/unselected to know if close/open
            var isSelected = false;
            var i = that.toSafePortName(item.Name);
            if ($('#' + i + "Cb").is(":checked")) isSelected = true;

            //console.log("isSelected:", isSelected);
            if (isSelected) {
                // open the port
                // get baud rate picked
                var baud = $('#' + i + "Baud").val();
                var buffer = $('#' + i + "Buffer").val();
                that.serialConnect(item.Name, baud, buffer);
                //that.publishSysMsg("Serial port " + port.Friendly + " opened with baud rate " + baud);
            } else {
                // close the port
                $('#' + i + "Buffer").prop("disabled", false);

                that.serialDisconnect(item.Name);
                //that.publishSysMsg("Serial port " + port.Friendly + " closed");
            }
        },
        bufferAlgorithms: null,
        getBufferAlgorithms: function() {
            if (bufferAlgorithms == null) {
                console.log("Need to load algorithms from serial port json server");
                this.wsSend("bufferalgorithms");

            }
        },
        getBaudRates : function() {
            var bauds = ["2,400", "4,800", "9,600", "19,200", "38,400", "57,600", "115,200", "230,400"];
            var baudHtml = "";
            $.each(bauds, function(i, item) {
                var clean = item.replace(/,/, "");
                baudHtml += "<option value=\"" + clean + "\">" + item + "</option>";
            });
            return baudHtml;
        },
        onWsConnect: function (event) {
            this.isWsConnected = true;
            //console.log(this.conn);
            //console.log(event);
            chilipeppr.publish("/" + this.id + "/ws/onconnect", "connected");
            //this.publishSysMsg("Serial port ajax connection opened at " + this.conn.url + ", readyState: " + this.conn.readyState);
            $('.com-chilipeppr-widget-serialport-install').addClass('hidden');
            // because we're hiding a large mess of text, we should trigger
            // a resize to make sure other widgets reflow since the scroll bar
            // or other stuff may need repositioned
            $(window).trigger('resize');
        },
        onWsDisconnect: function (event) {
            this.hideVersion();
            this.isWsConnected = false;
            chilipeppr.publish("/" + this.id + "/ws/ondisconnect", "disconnected");
            this.publishSysMsg("Serial port ajax connection closed. " +
                "readyState: " + this.conn.readyState);
        },
        statusWatcher: function () {
            // This method subscribes to "/ws/sys" and updates the UI with
            // the latest msg
            chilipeppr.subscribe("/" + this.id + "/ws/sys", this, function (msg) {
                $('.com-chilipeppr-widget-serialport-status .well.well-sm').text(msg);
            });
        },
        forkSetup: function () {
            var topCssSelector = '.com-chilipeppr-widget-serialport';
            //$(topCssSelector + ' .fork').prop('href', this.fiddleurl);
            //$(topCssSelector + ' .standalone').prop('href', this.url);
            //$(topCssSelector + ' .fork-name').html(this.id);
            $(topCssSelector + ' .panel-title').popover({
                title: this.name,
                content: this.desc,
                html: true,
                delay: 200,
                animation: true,
                trigger: 'hover',
                placement: 'auto'
            });

            // load the pubsub viewer / fork element which decorates our upper right pulldown
            // menu with the ability to see the pubsubs from this widget and the forking links
            var that = this;
            chilipeppr.load("http://fiddle.jshell.net/chilipeppr/zMbL9/show/light/", function () {
                require(['inline:com-chilipeppr-elem-pubsubviewer'], function (pubsubviewer) {
                    pubsubviewer.attachTo($('.com-chilipeppr-widget-serialport .panel-heading .dropdown-menu'), that);
                });
            });
        },

    }
});