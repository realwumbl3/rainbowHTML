html`
    <div id="normal_div">
        <div></div>
    </div>
`;
html`
    <div id="sharetube_main">
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
        <div zyx-if=${[this.voteMenuVisible, (v) => v]}></div>
    </div>
`;
html`
    <div id="test2">
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
        <div test=${"test"}></div>
    </div>
`;

html`
    <div class="directNestingHTML">
        Direct Nesting HTML:
        ${html`
            <div id="nestedHtml">
                Depth1
                ${html` <div id="nestedHtml2">
                        Depth2
                        ${html`<div id="nestedHtml3">Depth3</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>
                            <div id="nestedHtml3Sibling">Depth3 sibling</div>`}
                    </div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>
                    <div id="nestedHtml2Sibling">Depth2 sibling</div>`}
            </div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
            <div id="nestedHtmlSibling">Depth1 sibling</div>
        `}
    </div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
    <div class="directNestingHTMLSibling">directNesting sibling</div>
`;

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
                    // Don't focus if clicking inside room-actions
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
