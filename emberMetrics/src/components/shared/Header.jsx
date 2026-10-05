import {createRef} from "react";

export default function Header (props) {
    const metrics = props.metrics
    const devices = props.devices


    function changeRemoteDevice(device) {
        props.setSelectedDevice(device)
        console.log("[APP_METRICS] Change remote device: ", device.name)
        props.handleNotification("notice", `changed Remote Device to:\n ${device.name}`)
        props.setMetrics(null)
        props.setTimeMetrics([])
    }

    let deviceButtonList
    if (devices) {
        deviceButtonList = devices.map((device) => {
            return(<button key={device.id} className={props.selectedDevice === device ?"general-button__selection general-button-selection__clicked disabled-button": "general-button__selection"} onClick={() => {
                changeRemoteDevice(device)
                props.setMetrics(null)
            }} style={{
                minWidth: "fit-content",
                maxWidth: "fit-content",
            }}>{device.name}</button>)
        })
    }

    const groupsRef = createRef()
    const handleWheel = (e) => {
        if (groupsRef.current) {
            e.preventDefault()
            groupsRef.current.scrollLeft += e.deltaY;
        }
    }

    return (
        <>
        <header style={{display: 'flex', flexDirection: 'row'}} className={props.activeView === 'fullScreen' ? "display-none" : 'header'}>
            {((props.authentication === false && props.isLoggedIn === false) || props.isLoggedIn === true) &&
                <>
                <img src={props.logoImage} alt="ember metrics logo" />
            {props.viewPort > 1100 && <h1 style={{textAlign: 'center'}}>Ember Metrics</h1>}
            <header className="header-details__wrapper">
                    <div className="header__details">
                        {(metrics && props.activeView === "resources") && <div className="header__device-name">
                            <h3>Device:</h3>
                            <p style={{
                                borderBottom: '1px solid var(--border-color)',
                            }}>{metrics.hostName}</p>
                        </div>}
                    </div>
                    <div className={"header-navigation"}>
                        <p className={
                            props.activeView === "resources"
                                    ? "header-navigation__links disabled-button"
                                    : "header-navigation__links"
                        } onClick={() => {
                            props.setActiveView("resources");
                            console.log("view set to Metrics")
                        }}>
                            Metrics
                        </p>
                        <p className={
                            props.activeView === "settings"
                                    ? "header-navigation__links disabled-button"
                                    : "header-navigation__links"
                        } onClick={(e) => {
                            props.setActiveView("settings")
                            console.log("view set to Settings")
                        }}>
                            Settings
                        </p>
                        <p className={
                            props.activeView === "admin"
                                    ? "header-navigation__links disabled-button"
                                    : "header-navigation__links"
                        } onClick={() => {
                            props.setActiveView("admin")
                            console.log("view set to Admin")
                        }}>
                            Administration
                        </p>
                        <p className={
                            props.activeView === "devices"
                                    ? "header-navigation__links disabled-button"
                                    : "header-navigation__links"
                        } onClick={() => {
                            props.setActiveView("devices")
                            console.log("view set to Devices")
                        }}>
                            Devices
                        </p>
                    </div>
            </header>
                </>
            }
            {(props.isLoggedIn === false) && <h1 style={{textAlign: 'center'}}>Welcome to Ember Metrics</h1>}
        </header>
            {((props.activeView === "resources" && props.devices) && props.isLoggedIn === true) &&
                <>
                    <div className={"device-navigation__wrapper"} ref={groupsRef} onWheel={handleWheel}>
                        <div className={"device-navigation"}>
                            {deviceButtonList}
                        </div>
                    </div>
                </>
            }
        </>
    )
}