import {useEffect, useRef, useState} from "react";
import SoftwareManagement from "./SoftwareManagement/SoftwareManagement.jsx";
import SubNav from "../shared/SubNav.jsx";
import FirewallManagement from "./firewallManagement/FirewallManagement.jsx";
import LogDisplay from "./sharedAdmin/LogDisplay.jsx";
import UserManagement from "./UserManagement.jsx";
import GlobalDevices from "./GlobalDevices.jsx";

export default function Admin({devices, handleNotification,
                              hostIp, deviceType, viewPort,
                              user, setUser , checkReservedDeviceProperties}) {
    const deviceList = devices
    const [allUsers, setAllUsers] = useState([]);
    const [allDevices, setAllDevices] = useState([]);

    useEffect(() => {
        if (user?  user.role !== "admin" : false) return;
        getAllUsers();
        getALlDevices();
    }, []);

    async function getAllUsers() {
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has ran out, please refresh the page');
            }
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : '127.0.0.1'}:3000/users`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'x-session-id': sessionId,
                }
            })
            if (response.ok) {
                const resData = await response.json()
                if (resData.success) {
                    setAllUsers(resData.users)
                }
            }
        } catch (e) {
            handleNotification('error', `could not get the user list for the admin: ${user.username}`)
        }
    }

    async function getALlDevices () {
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has ran out, please refresh the page');
            }
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : '127.0.0.1'}:3000/devices`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'x-session-id': sessionId,
                }
            })
            if (response.ok) {
                const resData = await response.json()
                console.log(JSON.stringify(resData.success, null, 2))
                if (resData.success) {
                    setAllDevices(resData.devices)
                } else {
                    handleNotification('error', `Could not get all the devices for the admin ${user.username}`);
                }
            }

        } catch (e) {
            handleNotification('error', `Could not get all the devices for the admin ${user.username}`);
            console.log(e)
        }
    }

    const adminNavList = user? user.role === 'admin' ?
        ['Software', 'Firewall', 'User Management', 'Global Devices']
        : ['Software', 'Firewall']
        : ['Software', 'Firewall']

    const [adminView, setAdminView] = useState('Software');
    const [selectedDevice, setSelectedDevice] = useState({
        name: ""
    });
    const [installation, setInstallation] = useState(false);
    const [displayLogs, setDisplayLogs] = useState(false);
    const [logs, setLogs] = useState([]);
    const logDisplayRef = useRef(null);

    async function handleLogs(response) {
        try {
            if (!response || !response.body) return false;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let isDone = false;
            setInstallation(prevState => !prevState);
            setDisplayLogs(prevState => !prevState);

            while(!isDone) {
                const {value, done} = await reader.read();
                isDone = done;

                if(value) {
                    const chunk = decoder.decode(value, {stream: true});
                    setLogs(prevLogs => [...prevLogs, chunk]);
                }
            }
            setInstallation(prevState => !prevState);
            console.log('[ Client - Admin /handleLogs] Log streaming finished');
            return true;
        } catch (e) {
            console.info('Error handling logs: ', e.message)
        }
    }

    return (
        <div className="admin__wrapper">
            <section className={'admin'}>
                <header className={'section-header'}>
                    <h1>Administration</h1>
                </header>
                <SubNav subView={adminView} setSubView={setAdminView} subNavList={adminNavList}/>
                {displayLogs && <LogDisplay setDisplayLogs={setDisplayLogs} logs={logs} setLogs={setLogs} logDisplayRef={logDisplayRef} viewPort={viewPort} />}
                {adminView === 'Software' && <SoftwareManagement devices={deviceList} adminView={adminView}
                                                                 handleNotification={handleNotification}
                                                                 hostIp={hostIp}
                                                                 deviceType={deviceType}
                                                                 selectedDevice={selectedDevice}
                                                                 handleLogs={handleLogs}
                                                                 setSelectedDevice={setSelectedDevice}
                                                                 installation={installation}
                                                                 setInstallation={setInstallation}
                                                                 viewPort={viewPort} user={user}/>}
                {adminView === 'Firewall' && <FirewallManagement devices={deviceList} adminView={adminView}
                                                                 handleNotification={handleNotification}
                                                                 hostIp={hostIp}
                                                                 deviceType={deviceType}
                                                                 selectedDevice={selectedDevice}
                                                                 setSelectedDevice={setSelectedDevice}
                                                                 handleLogs={handleLogs}
                                                                 installation={installation}
                                                                 setInstallation={setInstallation}
                                                                 viewPort={viewPort} user={user}/>}
                {user &&
                    <>
                        {user.role === "admin" && adminView === "User Management" &&
                        <UserManagement users={allUsers} allDevices={allDevices}
                                        handleNotification={handleNotification}
                                        deviceType={deviceType}
                                        hostIp={hostIp}
                                        admin={user}
                                        setAdmin={setUser}
                                        setUsers={setAllUsers}/>}
                </>
                }
                {user &&
                    <>
                        {user.role === "admin" && adminView === "Global Devices" &&
                            <GlobalDevices allDevices={allDevices}
                                           handleNotification={handleNotification}
                                           user={user}
                                           setUser={setUser}
                                           deviceType={deviceType}
                                           hostIp={hostIp}
                                           setAllDevices={setAllDevices}
                                           checkReservedDeviceProperties={checkReservedDeviceProperties}/>}
                    </>
                }
            </section>
        </div>
    )
}