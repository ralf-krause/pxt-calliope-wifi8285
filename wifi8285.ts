/**
 * Functions for Wifi8285 module.
 */
//% weight=10 color=#606060 icon="\uf1eb" block="Wifi8285"

namespace Wifi8285 {

    let isWifiConnected = false;
    /**
     * Setup UART Wifi8285 to connect to  Wifi
     */
    //% weight=100
    //% block="setup Wifi|TX %txPin|RX %rxPin|baudrate %baudrate|ssid = %ssid|password = %passwd"
    //% txPin.defl=SerialPin.C17
    //% rxPin.defl=SerialPin.C16
    //% baudRate.defl=BaudRate.BaudRate115200
    //% ssid.defl="Calliope"
    //% passwd.defl="12345678"
    export function setupWifi(txPin: SerialPin, rxPin: SerialPin, baudRate: BaudRate, ssid: string, passwd: string) {
        let result = 0

        isWifiConnected = false

        serial.redirect(
            txPin,
            rxPin,
            baudRate
        )

        sendAtCmd("AT")
        result = waitAtResponse("OK", "ERROR", "None", 1000)

        sendAtCmd("AT+CWMODE=1")
        result = waitAtResponse("OK", "ERROR", "None", 1000)

        sendAtCmd(`AT+CWJAP="${ssid}","${passwd}"`)
        result = waitAtResponse("WIFI GOT IP", "ERROR", "None", 20000)

        if (result == 1) {
            isWifiConnected = true
        }
    }

    /**
     * Check if UART Wifi8285 is connected to Wifi
     */
    //% weight=90
    //% block="Wifi OK?"
    export function wifiOK() {
        return isWifiConnected
    }


    /*--------------------------------------------------------------------*/
    /**
     * Send data to ThinkSpeak
     */
    //% block="send data to ThinkSpeak |API key %apiKey|field 1 %field1||field 2 %field2|field 3 %field3|field 4 %field4|field 5 %field5|field 6 %field6|field 7 %field7|field 8 %field8|"
    //% expandableArgumentMode="enabled"
    //% apiKey.defl="API Key"
    //% subcategory="ThingSpeak"
    export function sendToThinkSpeak(apiKey: string, field1: number = 0, field2: number = 0, field3: number = 0, field4: number = 0, field5: number = 0, field6: number = 0, field7: number = 0, field8: number = 0) {
        let result = 0
        let retry = 2

        // close the previous TCP connection
        if (isWifiConnected) {
            sendAtCmd("AT+CIPCLOSE")
            waitAtResponse("OK", "ERROR", "None", 2000)
        }

        while (isWifiConnected && retry > 0) {
            retry = retry - 1;
            // establish TCP connection
            sendAtCmd("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80")
            result = waitAtResponse("OK", "ALREADY CONNECTED", "ERROR", 2000)
            if (result == 3) continue

            let data = "GET /update?api_key=" + apiKey
            if (!isNaN(field1)) data = data + "&field1=" + field1
            if (!isNaN(field2)) data = data + "&field2=" + field2
            if (!isNaN(field3)) data = data + "&field3=" + field3
            if (!isNaN(field4)) data = data + "&field4=" + field4
            if (!isNaN(field5)) data = data + "&field5=" + field5
            if (!isNaN(field6)) data = data + "&field6=" + field6
            if (!isNaN(field7)) data = data + "&field7=" + field7
            if (!isNaN(field8)) data = data + "&field8=" + field8

            sendAtCmd("AT+CIPSEND=" + (data.length + 2))
            result = waitAtResponse(">", "OK", "ERROR", 2000)
            if (result == 3) continue
            sendAtCmd(data)
            result = waitAtResponse("SEND OK", "SEND FAIL", "ERROR", 5000)

            // // close the TCP connection
            // sendAtCmd("AT+CIPCLOSE")
            // waitAtResponse("OK", "ERROR", "None", 2000)

            if (result == 1) break
        }
    }


    /*--------------------------------------------------------------------*/
    /**
     * Send data to IFTTT
     */
    //% block="send data to IFTTT |event %event|key %key|value 1 %value1 value 2 %value2 value 3 %value3"
    //% event.defl="event"
    //% key.defl="service key"
    //% subcategory="IFTTT"
    export function sendToIFTTT(event: string, key: string, value1: string, value2: string, value3: string) {
        let result = 0
        let retry = 2

        // close the previous TCP connection
        if (isWifiConnected) {
            sendAtCmd("AT+CIPCLOSE")
            waitAtResponse("OK", "ERROR", "None", 2000)
        }

        while (isWifiConnected && retry > 0) {
            retry = retry - 1;
            // establish TCP connection
            sendAtCmd("AT+CIPSTART=\"TCP\",\"maker.ifttt.com\",80")
            result = waitAtResponse("OK", "ALREADY CONNECTED", "ERROR", 2000)
            if (result == 3) continue

            let data = "GET /trigger/" + event + "/with/key/" + key
            data = data + "?value1=" + value1
            data = data + "&value2=" + value2
            data = data + "&value3=" + value3
            data = data + " HTTP/1.1"
            data = data + "\u000D\u000A"
            data = data + "User-Agent: curl/7.58.0"
            data = data + "\u000D\u000A"
            data = data + "Host: maker.ifttt.com"
            data = data + "\u000D\u000A"
            data = data + "Accept: */*"
            data = data + "\u000D\u000A"

            sendAtCmd("AT+CIPSEND=" + (data.length + 2))
            result = waitAtResponse(">", "OK", "ERROR", 2000)
            if (result == 3) continue
            sendAtCmd(data)
            result = waitAtResponse("SEND OK", "SEND FAIL", "ERROR", 5000)
            // close the TCP connection
            // sendAtCmd("AT+CIPCLOSE")
            // waitAtResponse("OK", "ERROR", "None", 2000)
            if (result == 1) break
        }
    }


    /*--------------------------------------------------------------------*/

    function waitAtResponse(target1: string, target2: string, target3: string, timeout: number) {
        let buffer = ""
        let start = input.runningTime()

        while ((input.runningTime() - start) < timeout) {
            buffer += serial.readString()

            if (buffer.includes(target1)) return 1
            if (buffer.includes(target2)) return 2
            if (buffer.includes(target3)) return 3

            basic.pause(100)
        }

        return 0
    }

    function sendAtCmd(cmd: string) {
        serial.writeString(cmd + "\u000D\u000A")
    }
    
}