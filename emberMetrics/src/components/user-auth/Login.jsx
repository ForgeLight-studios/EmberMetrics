import { useState } from "react";

export default function Login (props) {

    const [isRegister, setIsRegister] = useState(false);

    async function submit (e) {
        e.preventDefault();

        const { username, password, confirmPassword } = e.target;
        const user = {
            username: username.value,
            password: password.value,
            email: "",
            bio: "",
            active: true
        };
        if (isRegister) {
            user.confirmPassword = confirmPassword.value;
            user.role = 'user';
            user.devices = [
                {
                    name: "localhost1",
                    ip: "127.0.0.1",
                    id: "DgxI77r32HDNeBfh0sK8B",
                    isHost: true,
                }
            ]
        }
        // Validation
        if (!user.username || !user.password || (isRegister && !user.confirmPassword)) return props.handleNotification('error', 'Please send all fields required');

        try {
            const response = await fetch(
                `http://${props.deviceType === 'remote-access' ? props.hostIp : 'localhost'}:3000${isRegister ? '/users' : '/users/login'}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user }),
                }
            );

            if (!response.ok) {
                if (response.status === 400) {
                    props.handleNotification('error', 'Please send all fields required');
                    return
                }
                if (response.status === 403) return props.handleNotification('error', 'Your account has been deactivated');
                props.handleNotification('error', `Could not ${isRegister ? 'registered' : 'login'} as: ${user.username} : Server error`);
                return
            } else {
                props.handleNotification('error', 'Could not login: Server Error');
            }
            // Only login expects JSON back
            if (!isRegister) {
                const resData = await response.json();
                if (resData.success) {
                    localStorage.setItem('sessionId', resData.sessionId);
                    props.setUser(resData.user);
                    props.setActiveView('resources')
                    props.handleNotification('notice', `Successfully ${isRegister ? 'registered' : 'logged in'} as: ${user.username}`);
                }
            }
            props.setIsLoggedIn(prev => !prev);
        } catch {
            props.handleNotification('error', 'There was an issue with the server, sorry');
        }
    }
    return (
        <div className="login-wrapper">
            <section className={'login'}>
                <header className="section-header" style={{minWidth: '100%', marginBottom: '30px', borderBottom: 'none', justifyContent: 'center'}}>
                    <h1 style={{width: '50%', textAlign: 'center', borderBottom: '1px solid var(--border-color)'}}>{isRegister ? 'Register' : 'Login'}</h1>
                </header>
                <form className="login-form" onSubmit={submit}>
                    <div className="input-container">
                        <label>User Name:</label>
                        <input type={'text'} name={'username'} placeholder={'user123'}/>
                    </div>
                    <div className="input-container">
                        <label>Password:</label>
                        <input type={'password'} name={'password'} placeholder={'password123'}/>
                    </div>
                    {/*{isRegister && <div className="input-container">*/}
                    {/*    <label>Confirm Password:</label>*/}
                    {/*    <input type={'password'} name={'confirmPassword'} placeholder={'password123'}/>*/}
                    {/*</div>}*/}
                    <button className={'general-button'} type={'submit'} >{isRegister ? 'Register' : 'Login'}</button>
                </form>
                {/*<div className="form-links">*/}
                {/*    <div className={'link-container'}>*/}
                {/*        <p>{isRegister ? 'Have an account?' : 'Don\'t have an account?' }</p>*/}
                {/*        <p className={'link-container__link'}onClick={() => {*/}
                {/*            console.info('clicked');*/}
                {/*            setIsRegister(prevState => !prevState);*/}
                {/*        }}>{isRegister ? 'Login' : 'Register'}</p>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </section>
        </div>
    )
}