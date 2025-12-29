class RoomSidebarComponent {
    constructor(room) {
        this.room = room;
        this.expanded = new LiveVar(false);
        html`
            <div
                class="room-component"
                expanded=${this.expanded.interp((expanded) => expanded || null)}
                focused=${state.currentRoom.interp((currentRoom) => currentRoom === room || null)}
                zyx-click=${(e) => {
                    // if clicking inside room-actions, don't focus
                    if (e.target.closest(".room-actions")) return;
                    this.room.focus();
                }}
            >
                <h2>
                    Room: ${this.room.roomCode} - ${this.room.seconds.interp((seconds) => seconds.toString())} seconds
                </h2>
                <div class="room-actions">
                    <button class="btn btn-secondary" zyx-click=${() => this.room.leaveRoom()}>Leave Room</button>
                </div>
            </div>
        `.bind(this);
    }
}

html`
    <div
        onclick=${() => {
            // This is a single line comment
            /* This is a multi-line
               comment that spans
               multiple lines */
            console.log("clicked");
            if (true) {
                // inline comment
                return;
            }
        }}
        data-test=${/* comment */ "value"}
    >
        <button>Click me</button>
    </div>
`;

// Simplified test case - this div should be colored red
html`
    <div class="test">
        <span>Simple test</span>
    </div>
`;

// Test with comment in ${} - this div should be colored red
html`
    <div
        onclick=${() => {
            // comment
            console.log("test");
        }}
    >
        <span>With comment</span>
    </div>
`;
