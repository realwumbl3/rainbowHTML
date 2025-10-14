export default function Test() {
    return (
        <div id="sharetube_main">
            <h1>Hello World</h1>
            <p>This is a paragraph</p>
            <a href="https://www.google.com">Google</a>
            <img
                src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                alt="Google Logo"
            />
            <button>Click me</button>
            <input type="text" placeholder="Enter your name" />
            <select name="cars" id="cars">
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="mercedes">Mercedes</option>
                <option value="audi">Audi</option>
                <option value="ferrari">Ferrari</option>
                <option value="lamborghini">Lamborghini</option>
                <option value="bugatti">Bugatti</option>
                <option value="porsche">Porsche</option>
                <option value="rolls-royce">Rolls-Royce</option>
                <option value="bentley">Bentley</option>
                <option value="mclaren">McLaren</option>
                <option value="aston-martin">Aston Martin</option>
                <option value="jaguar">Jaguar</option>
            </select>
            <div id="parent">
                <div id="child">
                    <div id="grandchild"></div>
                    <div id="grandchild"></div>
                    <div id="grandchild" foo="bar" bar="foo">
                        <button class="rounded_btn" title="Vote">
                            <label>Vote</label>
                            <icon name="vote" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
