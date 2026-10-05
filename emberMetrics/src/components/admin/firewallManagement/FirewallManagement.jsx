import {useState} from "react";
import PortSelection from "./PortSelection.jsx";
import DeviceSelection from "../sharedAdmin/DeviceSelection.jsx";
import RuleSelection from "./RuleSelection.jsx";
import ItemSelection from "../SoftwareManagement/ItemSelection.jsx";

export default function FirewallManagement({ devices, selectedDevice, setSelectedDevice,
                                               handleNotification, deviceType,
                                               hostIp, handleLogs, installation, viewPort, user}) {
    const [chosenPort, setChosenPort] = useState(0)
    const [chosenRule, setChosenRule] = useState('')

    function resetFields () {
        setSelectedDevice({
            name: ""
        })
        setChosenRule('')
        setChosenPort(0)
    }

    const rules = [
        {name: 'allow'},
        {name: 'deny'},
        {name: 'default allow incoming'},
        {name: 'default deny incoming'},
        {name: 'default allow outgoing'},
        {name: 'default deny outgoing'},
    ];

    async function setFireWallRule(args) {
        resetFields()
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has ran out, please refresh the page');
            }
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : '127.0.0.1:3000/devices/fireWallRule'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify(args)
            })

            if (response.ok) {
                const installed = await handleLogs(response)
                if (installed) handleNotification('notice', `Set the rule: ${chosenRule} ${(chosenRule === "allow" || chosenRule === "deny" ? `- ${chosenPort}`: '')} on the machine: ${selectedDevice.name}`);
                return
            } else if (response.status === 403) {
                handleNotification('error', 'You dont have permission to access this device')
                return
            }
            handleNotification('error', `fireWall rule failed.`);
        } catch (e) {
            handleNotification('error', 'Server error, sorry')
        }
    }


    async function chooseParams() {
        if (chosenRule || chosenRule === "allow" || chosenRule === "deny") {
            await setFireWallRule({
                device: selectedDevice,
                rule: chosenRule,
                chosenPort: chosenPort,
                user: user,
            });
            return
        } else if (chosenRule && chosenPort && selectedDevice) {
            await setFireWallRule({
                device: selectedDevice,
                rule: chosenRule,
                user: user,
        });
            return
        }
        handleNotification('error', 'Please select all fields');
    }

    return (
        <div className={installation? "admin-item disabled-element" : "admin-item"}>
            <header className={'section-header'}>
                <h1>Firewall Management</h1>
            </header>
            <ItemSelection selectedItem={chosenRule} setSelectedItem={setChosenRule}
                           items={rules} title={'rule'} columns={4} viewPort={viewPort}/>
            <PortSelection chosenPort={chosenPort}
                           setChosenPort={setChosenPort}
                           chosenRule={chosenRule}/>
            <DeviceSelection devices={devices}
                             selectedDevice={selectedDevice}
                             setSelectedDevice={setSelectedDevice} />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                <button className={'general-button success-button'} onClick={async () => {
                    await chooseParams()
                }}>Create Rule</button>
                <button className={'general-button danger-button'} onClick={() => {
                    resetFields()
                }}>Reset</button>
            </div>
        </div>
        )
}