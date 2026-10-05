import {useState} from "react";
import Select from 'react-select'
import YouSure from "../shared/YouSure.jsx";

export default function UserManagement({users, allDevices, handleNotification, deviceType, hostIp, admin, setAdmin, setUsers}) {
    let userList =[]
    const [editUser, setEditUser] = useState({
        id:''
    })
    const [selectedAddDevice, setSelectedAddDevice] = useState(false)
    const [selectedDeleteDevice, setSelectedDeleteDevice] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        email: '',
        role: 'user',
    });

    async function createUser() {
        if (!newUser.username || !newUser.password) {
            handleNotification('error','Username and password are required');
            return;
        }
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has run out, please refresh the page');
                return;
            }
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : '127.0.0.1'}:3000/admin/createUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    admin: admin,
                    newUser: newUser,
                }),
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.success) {
                    setUsers(prev => [...prev, resData.user]);
                    handleNotification('notice', `User ${newUser.username} has been created`);
                    setNewUser({ username: '', password: '', email: '', role: 'user' });
                    setIsCreating(false);
                    return;
                }
                if (resData.status === 409) {
                    handleNotification('error','A user with that username already exists');
                    return;
                }
            }
            handleNotification('error','Something went wrong, please try again');
        } catch (e) {
            console.error('[Client - createUser] error:', e);
            handleNotification('error', 'Server error, sorry');
        }
    }

    async function deactivateUser (account) {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            handleNotification('notice', 'Your session has ran out, please refresh the page');
        }
        if (!account) return
        try {
            const response = await fetch(`http://${deviceType === 'remote-access' ? hostIp : '127.0.0.1'}:3000/admin/toggleUserActive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "x-session-id": sessionId,
                },
                body: JSON.stringify({
                    admin: admin,
                    user: account,
                })
            })
            if (response.ok) {
                const resdata = await response.json()
                if (resdata.success) {
                    const updatedUsers = users.map((user) => {
                        if (user.id === account.id) {
                            return {
                                ...user,
                                active: !account.active
                            }
                        }
                        return user
                    })
                    setUsers(updatedUsers)
                    handleNotification('success', `The User: ${account.username}\'s account has been ${account.active ? 'deactivated' : 'activated'}`)
                    return
                }
            }
            handleNotification('error', `The User: ${account.username}\'s account could not be ${account.active ? 'deactivated' : 'activated'}`)
        } catch (e) {
        }
    }

    async function handleUserDevice(action) {
        const isAdd = action === 'add';
        const selectedDevice = isAdd ? selectedAddDevice : selectedDeleteDevice;

        if (!selectedDevice || !editUser) {
            handleNotification('error', `There was an issue ${isAdd ? 'granting' : 'revoking'} access, Please try again`);
            setEditUser({id: ''})
            return;
        }

        const updatedDevices = isAdd
            ? [...editUser.devices, selectedDevice]
            : editUser.devices.filter(d => d.id !== selectedDevice.id);

        const userData = { ...editUser, devices: updatedDevices };

        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                handleNotification('notice', 'Your session has ran out, please refresh the page');
            }
            const response = await fetch(`http://${deviceType === "remote-access" ? hostIp : "127.0.0.1"}:3000/admin/${isAdd ? 'addDevice' : 'removeDevice'}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-session-id": sessionId,
                },
                body: JSON.stringify({
                    admin: admin,
                    editUser: userData,
                    device: selectedDevice,
                }),
            });

            if (response.ok) {
                const resData = await response.json();
                if (resData.success) {
                    handleNotification('notice', `Updated ${editUser.username}'s allowed devices: ${isAdd ? `added ${selectedDevice.name} to` : `removed ${selectedDevice.name} from`} allowed devices`);
                    const updatedUsers = users.map((u) => {
                        if (u.id === editUser.id) {
                            return { ...u, devices: updatedDevices };
                        }
                        return u;
                    });
                    setUsers(updatedUsers);
                    if (editUser.username === admin.username) {
                        updateAdminDevices(isAdd)
                    }
                } else {
                    handleNotification('error', `Could not update ${editUser.username}'s allowed devices`);
                }
            }

            setEditUser({ id: '' });
            isAdd ? setSelectedAddDevice(false) : setSelectedDeleteDevice(false);

        } catch (e) {
            console.error(`[Client - ${isAdd ? 'addDevice' : 'deleteDevice'}] error:`, e);
            handleNotification('error', `Error ${isAdd ? 'adding' : 'deleting'} device`);
        }
    }

    function updateAdminDevices (isAdd) {
        let updatedDevices
        if (isAdd) {
            updatedDevices = [...admin.devices, selectedAddDevice]
        } else {
            updatedDevices = admin.devices.filter(d => d.id !== selectedDeleteDevice.id);
        }
        setAdmin(prev => {
            return {
                ...prev,
                devices: updatedDevices,
            }
        })
    }

    if (Array.isArray(users)) {
        userList = users.map((user) => {
            const userSpecificDeviceOptions = allDevices.filter(globalDevice => !user.devices.some(device => device.id === globalDevice.id));
            const allDeviceOptions = userSpecificDeviceOptions.map((device) => {
                return {
                    value: device,
                    label: device.name
                }
            })

            const userDevices = user.devices.map((device) => {
                return (
                        <div key={device.id} className={'user-container-item__details__entry'}>
                            <label>{device.name}</label>
                            <p>{device.ip}</p>
                            {editUser.id === user.id && <button className={'general-button danger-button'} onClick={() => {
                                //when created - pass the device through to the delete device function call
                                setIsDeleting(prevState => !prevState)
                                setSelectedDeleteDevice(device)
                            }}>X</button>}
                        </div>
                )
            })
            return (
                <div key={user.id} className={'users-container__item'}>
                    <div className={'user-container-item__name'}>
                        <p>{user.username}</p>
                        <p style={{color: user.active ? 'var(--success)' : 'var(--danger)'}}>{user.active ? 'Active' : 'Deactivated'}</p>
                    </div>
                    <div className={'user-container-item__details'}>
                        <div className={'user-container-item__details__entry'}>
                            <label>Email:</label>
                            <p>{user.email}</p>
                        </div>
                        <div className={'user-container-item__details__entry'}>
                            <label>Bio:</label>
                            <p>{user.bio}</p>
                        </div>
                        <div className={'user-container-item__details__entry'}>
                            <label>Role:</label>
                            <p>{user.role}</p>
                        </div>
                        {editUser.id === user.id &&
                            <div className={'user-container-item__details__controls'}>
                            <button className={'general-button danger-button'}
                                    onClick={() => deactivateUser(user)}>{user.active ? 'Deactivate' : 'Activate'}</button>
                            </div>
                        }
                        {editUser.id === user.id ?
                            <div className={'user-container-item__details__devices'}>
                            <h3>Allowed Devices</h3>
                            {userDevices}
                            <div className={'user-container-item__details__devices-select'}>
                                <h3>New Device</h3>

                                <Select options={allDeviceOptions} styles={{
                                    container: (base, state) => ({
                                        ...base,
                                        width: '100%',
                                        outline: 'none'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'var(--accent)',
                                        fontFamily: "'Inter', sans-serif"
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        '&:hover': {
                                            color: 'var(--secondary)',
                                        }
                                    }),
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: 'var(--neutral)',
                                        outline: 'none',
                                        boxShadow: state.isFocused ? '0 0 0 1px var(--secondary)' : 'none',
                                        border: state.isFocused ? '1px solid var(--secondary)' : '1px solid var(--accent)',
                                        '&:hover': {
                                            border: '1px solid var(--secondary)',
                                        }
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? 'var(--secondary-75)' : 'var(--neutral)',
                                        color: 'var(--accent)',
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: 'var(--neutral)',
                                        borderRadius: '0 0 10px 10px',
                                        padding: '5px',
                                        borderBottom: '1px solid var(--tertiary)',
                                    })
                                }} onChange={(selectedOption) => {
                                    setSelectedAddDevice(selectedOption.value)
                                }}     noOptionsMessage={() => 'No more devices to give access'}/>
                                {(editUser.id === user.id && selectedAddDevice !== false) &&
                                    <>
                                        <div key={selectedAddDevice.id} className={'user-container-item__details__entry'}>
                                            <label>{selectedAddDevice.name}</label>
                                            <p>{selectedAddDevice.ip}</p>
                                        </div>
                                    </>
                                }
                            </div>
                            <div className={'user-container-item__details__devices-controls'}>
                                <button className={'general-button success-button'} onClick={async () => {
                                    await handleUserDevice('add');
                                }}>Add
                                </button>
                                <button className={'general-button danger-button'} onClick={() => {
                                    setEditUser({
                                        id: ''
                                    })
                                }}>Cancel
                                </button>
                            </div>
                        </div>
                        :
                            <div className={'user-container-item__details__devices'}>
                                <h3>Allowed Devices</h3>
                                {userDevices}
                                <div className={'user-container-item__details__devices-controls'}>
                                    <button className={'general-button'} onClick={() => {
                                        setEditUser(user)
                                    }}>Edit
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            )
        })
    }
    return (
        <div className={'user-management'}>
            {isDeleting && <YouSure cancelFunction={() => setIsDeleting(false)}
                                    message={`Do you want to revoke access of ${selectedDeleteDevice.name} from`}
                                    messageHighlight={editUser.username}
                                    confirmFunction={async() => await handleUserDevice('delete')}/>}
            <header className={'section-header'}>
                <h1>User Management</h1>
            </header>
            <div className={'user-management__create'}>
                <div className={'user-management__create-header'}>
                    <h2>Register New User</h2>
                    <button className={isCreating ? 'general-button danger-button' : 'general-button success-button'} onClick={() => {
                        setIsCreating(prev => !prev);
                        setNewUser({ username: '', password: '', email: '', role: 'user' });
                    }}>
                        {isCreating ? 'Cancel' : '+ New User'}
                    </button>
                </div>
                {isCreating && (
                    <form className={'device-management__form'} onSubmit={async (e) => {
                        e.preventDefault();
                        await createUser();
                    }}>
                        <div className={'device-management__form-element'}>
                            <label>Username</label>
                            <input
                                type={'text'}
                                placeholder={'Username'}
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                        </div>
                        <div className={'device-management__form-element'}>
                            <label>Password</label>
                            <input
                                type={'password'}
                                placeholder={'Password'}
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                        <div className={'device-management__form-element'}>
                            <label>Email</label>
                            <input
                                type={'text'}
                                placeholder={'Email (optional)'}
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div className={'device-management__form-element'}>
                            <label>Role</label>
                            <Select options={[{value: 'user', label: 'User'}, {value: 'admin', label: 'Admin'}]} styles={{
                                container: (base, state) => ({
                                    ...base,
                                    width: '90%',
                                    outline: 'none'
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'var(--accent)',
                                    fontFamily: "'Inter', sans-serif"
                                }),
                                dropdownIndicator: (base) => ({
                                    ...base,
                                    '&:hover': {
                                        color: 'var(--secondary)',
                                    }
                                }),
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: 'var(--neutral)',
                                    outline: 'none',
                                    boxShadow: state.isFocused ? '0 0 0 1px var(--secondary)' : 'none',
                                    border: state.isFocused ? '1px solid var(--secondary)' : '1px solid var(--accent)',
                                    '&:hover': {
                                        border: '1px solid var(--secondary)',
                                    }
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? 'var(--secondary-75)' : 'var(--neutral)',
                                    color: 'var(--accent)',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: 'var(--neutral)',
                                    borderRadius: '0 0 10px 10px',
                                    padding: '5px',
                                    borderBottom: '1px solid var(--tertiary)',
                                })
                            }} onChange={(selectedOption) => {
                                setNewUser({...newUser, role: selectedOption.value})
                            }}     noOptionsMessage={() => 'No more devices to give access'}/>
                        </div>
                        <button
                            className={'general-button success-button'}
                            style={{ fontSize: '20px', marginTop: '10px' }}
                            type={'submit'}
                        >
                            Create User
                        </button>
                    </form>
                )}
            </div>
            <div className={'users-container__item'}>
                <div className={'user-container__header'}>
                    <p>Name</p>
                </div>
                <div className={'user-container__header'}>
                    <p>Details</p>
                </div>
            </div>
            <div className={'users-container'}>
                {userList}
            </div>
        </div>
    )
}