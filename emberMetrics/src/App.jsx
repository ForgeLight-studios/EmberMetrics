import {useEffect, useRef, useState} from "react";
// import './index.css'
import Header from "./components/shared/Header.jsx";
import Settings from "./components/settings/Settings.jsx";
import DeviceManagement from "./components/devices/DeviceManagement.jsx";
import Notification from "./components/settings/Notification.jsx";
import DeviceTypeSelection from "./components/onboarding/DeviceTypeSelection.jsx";
import Login from "./components/user-auth/Login.jsx";
import Profile from "./components/user-auth/Profile.jsx";
import HoveringButtons from "./components/metrics/HoveringButtons.jsx";
import Metrics from "./components/metrics/Metrics.jsx";
import Admin from "./components/admin/Admin.jsx"
import Sparkr from "./assets/SVG 2.1 - Original Sparkr.svg";
import Ocean from "./assets/SVG 2.1 - Ocean Blues.svg";
import Forest from "./assets/SVG 2.1 - Forest Green.svg";
import Royal from "./assets/SVG 2.1 - Royal Purple.svg";
import Berry from "./assets/SVG 2.1 - Berry red.svg";
import Magenta from "./assets/SVG 2.1 - Sunset Magenta.svg";
import Sunrise from "./assets/SVG 2.1 - orange sunrise.svg";
import Teal from "./assets/SVG 2.1 - Teal Lagoon.svg";
import Lavander from "./assets/SVG 2.1 - Lavander Mist.svg";
import Minty from "./assets/SVG 2.1 - Minty Fresh.svg";
import Sapphire from "./assets/SVG 2.1 - Midnight Sapphire.svg";
import Crimson from "./assets/SVG 2.1 - Crimson Ember.svg";
import Arctic from "./assets/SVG 2.1 - Arctic Cyan.svg";
import Copper from "./assets/SVG 2.1 - Copper Flame.svg";
import Emerald from "./assets/SVG 2.1 - Emerald Depths.svg";
import Violet from "./assets/SVG 2.1 - Violet Storm.svg";
import {nanoid} from "nanoid";

export default function App() {
    useEffect(() => {
        const sessionId = localStorage.getItem("sessionId")
        if (sessionId) {
            validateSessions(sessionId)
        }
    }, [])

    async function validateSessions(sessionId) {
        try {
            const response = await fetch(`http://${deviceType === 'remote-access'? hostIp : '127.0.0.1'}:3000/validateSession`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                })
            })
            if (response.ok) {
                const resData = await response.json()
                setIsLoggedIn(true)
                setActiveView('resources')
                setUser(resData.user)
            } else if (response.status === 403) {
                handleNotification('error', 'Your account has been deactivated')
                localStorage.removeItem("sessionId")
            } else {
                localStorage.removeItem("sessionId")
                handleNotification('error', 'Could not retrieve session: Server error')
            }

        } catch (e) {
            handleNotification('error', 'Your session has expired');
        }
    }

    const [isGraph, setIsGraph] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [metricInterval, setMetricInterval] = useState(1000);
    const [childProcessFilter, setChildProcessFilter] = useState('cpu');
    const [hostIp, setHostIP] = useState(() => {
        const hostPublicIP = localStorage.getItem('hostPublicIP')
        if (hostPublicIP) {
            return hostPublicIP
        }else {
            return ""
        }
    });

    if (!localStorage.getItem('childProcessLength')) {
        localStorage.setItem("childProcessLength", "10");
    }
    const [childProcessLength, setChildProcessLength] = useState(localStorage.getItem("childProcessLength"));

    useEffect(() => {
        localStorage.setItem("childProcessLength", childProcessLength);
    }, [childProcessLength])

    const [deviceType, setDeviceType] = useState(() => {
        const localStoreDeviceType = localStorage.getItem("deviceType");
        if (localStoreDeviceType === null || localStoreDeviceType === undefined || !localStoreDeviceType) {
            return ""
        } else {
            return localStoreDeviceType;
        }
    });

    const [logoImage, setLogoImage] = useState(() => Sparkr)

    useEffect(() => {
        function getPublicIP() {
            const host = window.location.hostname;
            console.log(window.location.hostname);
            if (host) {
                setHostIP(host);
                localStorage.setItem("hostPublicIP", host);
            }
        }
        if (hostIp === "" && deviceType === 'remote-access') getPublicIP();
    }, [hostIp, deviceType, isLoggedIn]);

    function changeFont (type, size) {
        switch (type) {
            case "text":        document.documentElement.style.setProperty(`--font-size`, `${size}px`);
                break;
            case "header":     document.documentElement.style.setProperty(`--font-size-header`, `${size}px`);
        }
    }

    const [notification, setNotification] = useState([]);

    const [devices, setDevices] = useState([])

    useEffect(() => {
        if (isLoggedIn && user) {
            const userDevices = user.devices;
            if (deviceType === "remote-access") {
                const localhost = userDevices.find((device) => device.name === "localhost" || device.ip === "127.0.0.1")
                if (localhost) {
                    const updatedDevices = userDevices.map((device) => {
                        if (device.name === "localhost" && device.ip === "127.0.0.1") {
                            return {
                                name: 'Host-Device',
                                ip: hostIp,
                            };
                        }
                        return device;
                    })
                    console.log('updatedDevices', JSON.stringify(updatedDevices, null, 2));
                    setDevices(updatedDevices);
                    setSelectedDevice(updatedDevices[0]);
                } else {
                    handleNotification('error', 'could not find localhost device')
                }
            } else {
                setDevices(user.devices)
                setSelectedDevice(user.devices[0]);
            }
        }
    }, [user, isLoggedIn, deviceType, hostIp, devices])

    useEffect(() => {
        //stores the deviceType in state
            localStorage.setItem("deviceType", deviceType);
    }, [deviceType])

    const [selectedDevice, setSelectedDevice] = useState(null);

    const [fontClicked, setFontClicked] = useState("medium");

    const [activeView, setActiveView] = useState(deviceType === "" ? "deviceTypeSelection" : isLoggedIn ? "resources" : 'login');

    useEffect(() => {
        console.log('activeView:', activeView)
    }, [activeView])

    const [isMetricSettings, setIsMetricSettings] = useState(false);

    const [metrics, setMetrics] = useState(null)
    //stores data over time for metrics, each object in the array is a value of teh metrics of each interval value
    const [timeMetrics, setTimeMetrics] = useState([])
    useEffect(() => {
        if (!metrics || !isGraph) return
        setTimeMetrics(prev => {
            const next = [metrics, ...prev ];
            if (next.length > 21) {
                next.pop(); //remove the oldest value
            }
            return next;
        })
    }, [metrics])

    const [themes, setThemes] = useState([
        {
            name: "Midnight Sapphire",
            colour: {
                secondary: "#2f5dff",
                tertiary: "#001f99",
                secondary75: "#2f5dff75",
                tertiary75: "#001f9975",
            },
            logo: Sapphire,
        },
        {
            name: "Crimson Ember",
            colour: {
                secondary: "#ff4d4d",
                tertiary: "#b30000",
                secondary75: "#ff4d4d75",
                tertiary75: "#b3000075",
            },
            logo: Crimson,
        },
        {
            name: "Arctic Cyan",
            colour: {
                secondary: "#42d7ff",
                tertiary: "#0288a8",
                secondary75: "#42d7ff75",
                tertiary75: "#0288a875",
            },
            logo: Arctic,
        },
        {
            name: "Copper Flame",
            colour: {
                secondary: "#ff7a42",
                tertiary: "#b34700",
                secondary75: "#ff7a4275",
                tertiary75: "#b3470075",
            },
            logo: Copper,
        },
        {
            name: "Emerald Depths",
            colour: {
                secondary: "#2ecc71",
                tertiary: "#0b7a3e",
                secondary75: "#2ecc7175",
                tertiary75: "#0b7a3e75",
            },
            logo: Emerald,
        },
        {
            name: "Violet Storm",
            colour: {
                secondary: "#9b42ff",
                tertiary: "#4b0099",
                secondary75: "#9b42ff75",
                tertiary75: "#4b009975",
            },
            logo: Violet,
        },
        {
            name: "Sparkr Original",
            colour: {
                secondary: "#FF8C42",
                tertiary: "#CC5803",
                secondary75: "#FF8C4275",
                tertiary75: "#CC580375",
            },
            logo: Sparkr,
        },
        {
            name: "Ocean Blues",
            colour: {
                secondary: "#4287f5",
                tertiary: "#0349cc",
                secondary75: "#4287f575",
                tertiary75: "#0349cc75",
            },
            logo: Ocean,
        },
        {
            name: "Forest Greens",
            colour: {
                secondary: "#42b883",
                tertiary: "#0a7e4e",
                secondary75: "#42b88375",
                tertiary75: "#0a7e4e75",
            },
            logo: Forest,
        },
        {
            name: "Royal Purples",
            colour: {
                secondary: "#8a42ff",
                tertiary: "#5e03cc",
                secondary75: "#8a42ff75",
                tertiary75: "#5e03cc75",
            },
            logo: Royal,
        },
        {
            name: "Berry Red",
            colour: {
                secondary: "#ff4270",
                tertiary: "#cc0349",
                secondary75: "#ff427075",
                tertiary75: "#cc034975",
            },
            logo: Berry,
        },
        {
            name: "Sunset Magenta",
            colour: {
                secondary: "#ff42a4",
                tertiary: "#cc0377",
                secondary75: "#ff42a475",
                tertiary75: "#cc037775",
            },
            logo: Magenta,
        },
        {
            name: "Golden Sunrise",
            colour: {
                secondary: "#ffb142",
                tertiary: "#cc8403",
                secondary75: "#ffb14275",
                tertiary75: "#cc840375",
            },
            logo: Sunrise,
        },
        {
            name: "Teal Lagoon",
            colour: {
                secondary: "#42f5e6",
                tertiary: "#03cccc",
                secondary75: "#42f5e675",
                tertiary75: "#03cccc75",
            },
            logo: Teal,
        },
        {
            name: "Lavender Mist",
            colour: {
                secondary: "#c742ff",
                tertiary: "#7f03cc",
                secondary75: "#c742ff75",
                tertiary75: "#7f03cc75",
            },
            logo: Lavander,
        },
        {
            name: "Minty Fresh",
            colour: {
                secondary: "#42f57a",
                tertiary: "#03cc49",
                secondary75: "#42f57a75",
                tertiary75: "#03cc4975",
            },
            logo: Minty,
        },
    ]);

    function randomColour () {
        const index = Math.floor(Math.random() * themes.length);
        return themes[index].secondary;
    }

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (darkMode) {
            return true
        } else {
            return false
        }
    });

    const [viewPort,setViewPort ] = useState([]);

    let windowWidth = window.innerWidth

    useEffect(() => {
        if (windowWidth <= 900 && fontClicked === 'large') {
            changeFont('text', 20);
            setFontClicked("medium");
        }
    }, [windowWidth, fontClicked]);

    function handleNotification(type, message) {
        const id = nanoid();

        setNotification(prev => [...prev, { id, type, message, active: false }]);

        // allow browser to paint the element first, then trigger transition
        setTimeout(() => {
            setNotification(prev => prev.map(n => n.id === id ? { ...n, active: true } : n));
        }, 10);

        setTimeout(() => {
            setNotification(prev => prev.map(n => n.id === id ? { ...n, active: false } : n));
        }, 3000);

        // remove from DOM after the transition has finished
        setTimeout(() => {
            setNotification(prev => prev.filter(n => n.id !== id));
        }, 3400); // 3500 + transition duration
        }

    useEffect(() => {
        const handleResize = () => {
            setViewPort(window.innerWidth)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [windowWidth])

    const savedTheme = JSON.parse(localStorage.getItem("theme"));

    useEffect(() => {
        if (savedTheme) {
            document.documentElement.style.setProperty("--secondary", savedTheme.colour.secondary);
            document.documentElement.style.setProperty("--tertiary", savedTheme.colour.tertiary);
            document.documentElement.style.setProperty("--secondary-75", savedTheme.colour.secondary75);
            document.documentElement.style.setProperty("--tertiary-75", savedTheme.colour.tertiary75);

            document.documentElement.style.setProperty("--dm-secondary", savedTheme.colour.secondary);
            document.documentElement.style.setProperty("--dm-tertiary", savedTheme.colour.tertiary);
            document.documentElement.style.setProperty("--dm-secondary-75", savedTheme.colour.secondary75);
            document.documentElement.style.setProperty("--dm-tertiary-75", savedTheme.colour.tertiary75);
            setLogoImage(savedTheme.logo);
        }
    }, []);


    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark-mode");
        } else {
            document.documentElement.classList.remove("dark-mode");
        }
    }, [isDarkMode])

    const isFetching = useRef(false);

    useEffect(() => {
        if (!isLoggedIn || (activeView !== 'resources' && activeView !== 'fullScreen')) return;
        if (!selectedDevice) return;

        let isMounted = true;
        let interval
        //This prevents the interval from setting metrics after the interval has changed. preventing any setMetrics from calling
        //unexpectedly

        const fetchMetrics = async () => {
            console.info('Fetching metrics');
            if(!selectedDevice) return

            if (isFetching.current) return;
            try {
                const sessionId = localStorage.getItem('sessionId');
                if (!sessionId) {
                    handleNotification('notice', 'Your session has ran out, please refresh the page');
                }
                isFetching.current = true;
                const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : 'localhost'}:3000`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        'x-session-id': sessionId,
                    },
                    body: JSON.stringify({
                        device: selectedDevice,
                        childLength: childProcessLength ? childProcessLength.toString() : "10",
                        user: user
                    })
                });
                const resData = await response.json();

                if (response.ok && resData.success) {
                    if (isMounted) setMetrics(resData.metrics);
                    return;
                }

                if (response.status === 403) {
                    handleNotification('error', 'You don\'t have access to this device');
                } else if (resData.reason === 'no_response') {
                    handleNotification('error', `${selectedDevice.name} did not respond, check the API`);
                } else {
                    handleNotification('error', `Failed to fetch metrics for: ${selectedDevice.name}`);
                }
                //instantly stops the interval, no fetches after initial failed fetch
                clearInterval(interval)
                setMetrics(null)
                isMounted = false;
            } catch (err) {
                clearInterval(interval);
                console.error("[APP_METRICS] Error fetching metrics:", err.message);
                handleNotification("error", "There was an error fetching metrics");
                setMetrics(null)
            } finally {
                isFetching.current = false;
            }
        };
        interval = setInterval(fetchMetrics, metricInterval);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedDevice, isLoggedIn, metricInterval, activeView, childProcessLength]);

    function checkReservedDeviceProperties(device) {
        console.log('checking for a reserved device property')
        const reservedProperties = ['localhost', 'host-device', '127.0.0.1'];
        const isReserved = reservedProperties.some(property => {
            return (device.ip.toLocaleLowerCase() === property || device.name.toLocaleLowerCase() === property);
        })
        if (isReserved) {
            console.log('device has a reserved property')
            handleNotification('error', 'Device used a reserved name or IP: \'localhost\', \'127.0.0.1\', \'host-device\'')
            return true
        }
        console.log('device does not have a reserved property')
        return false
    }

  return (
      <>
          <Notification notification={notification} setNotification={setNotification} />

          {(activeView === 'resources' || activeView === "fullScreen") &&
              <HoveringButtons isMetricSettings={isMetricSettings}
                               setIsMetricSettings={setIsMetricSettings}
                               activeView={activeView}
                               setActiveView={setActiveView}
                               isDarkMode={isDarkMode}
                               metricInterval={metricInterval}
                               themes={themes}
                               childProcessLength={childProcessLength}
                               setChildProcessLength={setChildProcessLength}
                               isGraph={isGraph}
                               setIsGraph={setIsGraph}
                               setMetricInterval={setMetricInterval}
                               handleNotification={handleNotification}
                               setTimeMetrics={setTimeMetrics}
                               childProcessFilter={childProcessFilter}
                               setChildProcessFilter={setChildProcessFilter} />
          }

          <Header metrics={metrics}
                   setIsDarkMode={setIsDarkMode}
                   isDarkMode={isDarkMode}
                   setActiveView={setActiveView}
                   activeView={activeView}
                  logoImage={logoImage}
                  viewPort={viewPort}
                  isLoggedIn={isLoggedIn} selectedDevice={selectedDevice}
                  isGraph={isGraph}
                  setIsGraph={setIsGraph}
                  devices={devices}
                  user={user}
                  setSelectedDevice={setSelectedDevice}
                  handleNotification={handleNotification}
                  setMetrics={setMetrics}
                  setTimeMetrics={setTimeMetrics}
          />

          <main className={(activeView === 'resources' || activeView === 'fullScreen') ? (deviceType === '' || isLoggedIn === false || !metrics) ? 'main-single-column' : '' : 'main-single-column'}>
              {(activeView === "deviceTypeSelection") && (deviceType === '') &&
                  <DeviceTypeSelection setDeviceType={setDeviceType}
                                       activeView={activeView}
                                       setActiveView={setActiveView}/>}

              {isLoggedIn === true && <>
                    <Metrics metrics={metrics}
                             isGraph={isGraph}
                             timeMetrics={timeMetrics}
                             metricInterval={metricInterval}
                             handleNotification={handleNotification}
                             viewPort={viewPort}
                             themes={themes}
                             randomColour={randomColour}
                             activeView={activeView}
                             setMetrics={setMetrics}
                             isDarkMode={isDarkMode}
                             childProcessFilter={childProcessFilter}/>

                  {activeView === "settings" && <Settings setActiveView={setActiveView}
                                                          devices={devices}
                                                          user={user}
                                                          setUser={setUser}
                                                          setIsDarkMode={setIsDarkMode}
                                                          isDarkMode={isDarkMode}
                                                          fontClicked={fontClicked}
                                                          setFontClicked={setFontClicked}
                                                          windowWidth={windowWidth}
                                                          handleNotification={handleNotification}
                                                          changeFont={changeFont}
                                                          setLogoImage={setLogoImage}
                                                          setmetricInterval={setMetricInterval}
                                                          metricInterval={metricInterval}
                                                          themes={themes}
                                                          childProcessLength={childProcessLength}
                                                          setChildProcessLength={setChildProcessLength}/>}

                  {activeView === "devices" && <DeviceManagement devices={devices}
                                                                 setDevices={setDevices}
                                                                 handleNotification={handleNotification}
                                                                 hostIp={hostIp}
                                                                 deviceType={deviceType}
                                                                 setUser={setUser}
                                                                 user={user}
                                                                 checkReservedDeviceProperties={checkReservedDeviceProperties}/>}
              </>}
              {activeView === 'profile' && <Profile user={user} handleNotification={handleNotification} setUser={setUser} devices={devices} hostIp={hostIp}/>}
              {activeView === 'login' && <Login handleNotification={handleNotification}
                                                                           hostIp={hostIp}
                                                                           setIsLoggedIn={setIsLoggedIn}
                                                                           deviceType={deviceType}
                                                                           setUser={setUser}
                                                                           devices={devices}
                                                                           setActiveView={setActiveView}/>}
              {activeView === 'admin' && <Admin handleNotification={handleNotification}
                                                devices={devices} hostIp={hostIp}
                                                deviceType={deviceType}
                                                viewPort={viewPort}
                                                user={user}
                                                setUser={setUser}
                                                checkReservedDeviceProperties={checkReservedDeviceProperties}/>}
          </main>
      </>
  )
}