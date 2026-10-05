import DeviceSelection from "../sharedAdmin/DeviceSelection.jsx";
import PackageManSelection from "./ItemSelection.jsx";
import {useRef, useState} from "react";
import PackageSelection from "./PackageSelection.jsx";
import ItemSelection from "./ItemSelection.jsx";

export default function SoftwareManagement({devices, handleNotification, hostIp, deviceType, selectedDevice,
                                               setSelectedDevice, handleLogs, installation, viewPort, user}) {
    const [selectedManager, setSelectedManager] = useState(null);
    const [chosenPackage, setChosenPackage] = useState('');
    const [chosenOperation, setChosenOperation] = useState('');

    const packageManagers = [
        {name: "apt"},
        {name: "yum"},
        {name: "dnf"},
        {name: "pacman"},
        {name: "zypper"},
        {name: "emerge"},
        {name: "flatpak"},
        {name: "snap"}
    ];

    const softwareOperation = [
        {name: 'install'},
        {name: 'remove'},
        {name: 'check'},
        {name: 'search'}
    ]

    function resetFields () {
        setSelectedDevice({
            name: "",
        })
        setChosenPackage('');
        setChosenOperation('')
        setSelectedManager(null);
    }

    async function runOperation(){
        if (selectedManager === '' || selectedDevice.name === '' || chosenPackage === '') {
            handleNotification('error', 'Make sure all fields are selected')
            return
        }
        resetFields()
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has ran out, please refresh the page');
            }
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp: '127.0.0.1'}:3000/devices/software`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json',
                'x-session-id': sessionId,},
                body: JSON.stringify({
                    packageName: chosenPackage,
                    device: selectedDevice,
                    packageManager: selectedManager,
                    operation: chosenOperation,
                    user: user
                })
            })

            if (response.ok) {
                const installed = await handleLogs(response)
                if (installed) handleNotification('notice', `Successfully ${chosenOperation === 'install' ? 'installed' : 'removed'} ${chosenPackage}`);
                return
            } else if (response.status === 403) {
                handleNotification('error', 'You dont have permission to access this device')
                return
            }
            handleNotification('error', `was unable to ${chosenOperation} ${chosenPackage}`);
        } catch (e) {
            console.info(e)
            handleNotification('error', 'There was an error with the server, sorry')
        }
    }

    return (
            <div className={installation ? "admin-item disabled-element" : "admin-item"}>
                <header className={'section-header'}>
                    <h1>Software Management</h1>
                </header>
                <ItemSelection selectedItem={chosenOperation}
                               setSelectedItem={setChosenOperation}
                               items={softwareOperation}
                               title={'operation'} columns={3} viewPort={viewPort}/>
                <ItemSelection selectedItem={selectedManager}
                               setSelectedItem={setSelectedManager}
                               items={packageManagers}
                               title={'package manager'} columns={4} viewPort={viewPort}/>
                <DeviceSelection devices={devices}
                                 selectedDevice={selectedDevice}
                                 setSelectedDevice={setSelectedDevice}
                                 viewPort={viewPort}/>
                <PackageSelection setChosenPackage={setChosenPackage}  chosenPackage={chosenPackage}/>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <button className={'general-button success-button'} onClick={async () => {
                        await runOperation()
                    }}>Run Operation</button>
                    <button className={'general-button danger-button'} onClick={() => {
                        resetFields()
                    }}>Reset</button>
                </div>
            </div>
    )
}