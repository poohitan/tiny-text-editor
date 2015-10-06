$(function() {
// ************ EDITOR CLASS ************ //
    var Editor = function() {
        /////////// FIELDS
        var editor = this;
        
        var currentHistoryState = -1;
        var history = [];
        this.historyLength = 20;
        
        this.view = $('#editor');
        this.view.panel = {};
        this.view.panel.items = [];
        this.view.container = null;
         
        this.selection = null;
                
        
        /////////// METHODS
        
        ////// LOGIC
        this.init = function() {
            var panel = $('<div id="panel"></div>');
            var container = $('<div id="container" contenteditable="true"></div>');
            editor.view.append(panel).append(container);
            
            var copiedPanelItems = editor.view.panel.items;
            
            editor.view.panel = panel;
            editor.view.panel.items = copiedPanelItems;
            editor.view.container = container;
            
            //Init buttons and separators
            for (var i = 0; i < editor.view.panel.items.length; ++i) {
                var item = editor.view.panel.items[i];
                item.init();
                editor.view.panel.append(item.view);
            }
            
            var currentState = editor.view.container.html();
            editor.addHistotyState(currentState);
        }
        
        this.getContent = function() {
            var content = editor.view.container.html();
            var regex = /^[<br\/?>\s&nbsp;?]*$/gi;
            if (regex.exec(content)) {
                return null;
            }
            return content;
        }
        
        this.getButtonByName = function(name) {
            var items = editor.view.panel.items;
            
            for (var i = 0; i < items.length; ++i) {
                if (items[i].name == name) {
                    return items[i];
                }
            }
        }
        
        this.addHistotyState = function() {
            console.log('trying to add history state');
            var state = editor.view.container.html();
            
            if (state == history[currentHistoryState]) {
                console.log('not adding state');
                return;
            }
    
            console.log('adding state');
            if (history.length == editor.historyLength) {
                history = history.slice(1);
            }
            else {
                currentHistoryState++;
            }
            history[currentHistoryState] = state;  
            
            console.log(history);
            console.log(currentHistoryState);
        }
        
        this.goBackInHistory = function() {
            console.log('going back');
            if (currentHistoryState > 0) {
                currentHistoryState--;
                editor.view.container.html(history[currentHistoryState]);
            }
            console.log(history);
            console.log(currentHistoryState);
        }
        
        this.goForwardInHistory = function() {
            console.log('going forward');
            if (currentHistoryState < editor.historyLength - 1) {
                currentHistoryState++;
                editor.view.container.html(history[currentHistoryState]);
            }
            console.log(history);
            console.log(currentHistoryState);
        }
        
        
        ////// VIEW
        
        this.addPanelItem = function(item) {
            editor.view.panel.items.push(item);
        }
        
        this.focus = function() {
            editor.view.container.focus();
        }
        
        this.highlight = function() {
            editor.view.addClass('focused');
        }
        
        this.unhighlight = function() {
            editor.view.removeClass('focused');
        }
        
        this.dragHighlight = function() {
            editor.view.container.addClass('dragenter');
        }
        
        this.dragUnhighlight = function() {
            editor.view.container.removeClass('dragenter');
        }
        
        this.sizeToWindow = function() {
            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();

            var newEditorHeight = viewportHeight - 140;
            editor.view.outerHeight(newEditorHeight);

            var newEditorContainerHeight = newEditorHeight - 35; //that.view.panel.outerHeight();
            editor.view.container.outerHeight(newEditorContainerHeight);
        }
        
        this.activateButtons = function() { //for example highlight 'Bold' button when cursor is on bold text
            var items = editor.view.panel.items;
            
            for (var itemName in items) {
                var item = items[itemName];
                if (item instanceof editor.Button) {
                    item.makeUnactive();
                }
            }
            
            if (editor.getContent()) {
                var nodeThatCursorIsInside = editor.selection.getRangeAt(0).startContainer.parentNode;
                var currentNode = nodeThatCursorIsInside;
                var parentNodesNames = [];
               // console.log(currentNode);

                while (currentNode.id !== Editor.view.container.attr('id')) {
                    parentNodesNames.push(currentNode.nodeName.toLowerCase());
                    currentNode = currentNode.parentNode;
                }

                //looping through selected node parents tree
                for (var i = 0; i < parentNodesNames.length; ++i) {
                    //looking for <b>, <strong> tags in tree... if found make 'Bold' button active
                    if (parentNodesNames[i] === 'b' || parentNodesNames[i] === 'strong') {
                        var button = editor.getButtonByName('b');
                        button.makeActive();
                    }
                    //looking for <im>, <em> tags
                    else if (parentNodesNames[i] === 'i' || parentNodesNames[i] === 'em') {
                        var button = editor.getButtonByName('i');
                        button.makeActive();
                    }
                    //other tags that have no synonyms (like <i> == <em>)
                    else {
                        var button = editor.getButtonByName(parentNodesNames[i]);
                        if (button) {
                            button.makeActive();
                        }
                    }
                }
            }
        }
        
        /////// Button constructor
        this.Button = function(name, description, iconURL, activeable, action) {
            var button = this;

            this.name = name || null;
            this.activeable = activeable || false;
            this.active = false;
            this.description = description || null;
            this.iconURL = iconURL || null;
            this.action = action || null;
            this.view = $('<button title="' + description + '"></button>');

            this.init = function() {
                button.view.attr('id', name);
                button.view.append($('<img src="' + button.iconURL + '"/></button>'));
                button.view.on('click', button.action);
                button.view.on('click', function() { 
                    if (button.active) {
                        button.makeUnactive();
                    }
                    else {
                        button.makeActive();
                    }
                    
                    editor.addHistotyState();
                    
                    editor.view.container.focus();
                });
            }

            this.makeActive = function() {
                if (button.activeable) {
                    button.view.addClass('active');
                    button.active = true;
                }
            }

            this.makeUnactive = function() {
                button.view.removeClass('active');
                button.active = false;
            }
        }
        
        /////// Separator constructor
        this.Separator = function(width) {
            var separator = this;

            this.width = width || 10;
            this.view = $('<div class="separator"></div>');

            this.init = function() {
                separator.view.css('margin-left', this.width / 2);
                separator.view.css('margin-right', this.width / 2);
            }
        }
    }
    
    // ************ EDITOR CLASS END ************ //
    
    
    ///////////// Setting up the editor instance
    ///////////// Creating and adding some buttons
    
    Editor = new Editor();
    
    var boldButton = new Editor.Button('b', 'Bold (Alt+B)', 'icons/cc_mono/font_bold_icon&16.png', true, function() {
        document.execCommand('bold', false, null);
    });
    Editor.addPanelItem(boldButton);
    
    var italicButton = new Editor.Button('i', 'Italic (Alt+I)', 'icons/cc_mono/font_italic_icon&16.png', true, function() {
        document.execCommand('italic', false, null);
    });
    Editor.addPanelItem(italicButton);
    
    var underlineButton = new Editor.Button('u', 'Underline (Alt+U)', 'icons/cc_mono/font_underline_icon&16.png', true, function() {
        document.execCommand('underline', false, null);
    });
    Editor.addPanelItem(underlineButton);
    
    var strikeButton = new Editor.Button('strike', 'Strike through (Alt+S)', 'icons/cc_mono/font_strokethrough_icon&16.png', true, function() {
        document.execCommand('strikeThrough', false, null);
    });
    Editor.addPanelItem(strikeButton);
    
    Editor.addPanelItem(new Editor.Separator());
    
    var increaseFontSizeButton = new Editor.Button('increaseFontSize', 'Increase font size (Alt++)', 'icons/cc_mono/round_plus_icon&16.png', false, function() {
        var oldContent = Editor.view.container.html();
        document.execCommand('increaseFontSize', false, null); //this feature works only in FF
        var newContent = Editor.view.container.html();
        
        if (oldContent != newContent) { //check if document.execCommand changed something in editor
            return;
        }
        else { //if no, it's not FF and we have to change font size manually
            var nodeThatCursorIsInside = Editor.selection.getRangeAt(0).endContainer.parentNode;
            var tagName = nodeThatCursorIsInside.tagName.toLowerCase();
            var size = nodeThatCursorIsInside.size || 4;
            if (tagName == 'font') {
                if (size < 7) {
                    size++;
                    document.execCommand('fontSize', false, size);
                }
            }
            else {
                document.execCommand('fontSize', false, size);
            }
        }
    });
    Editor.addPanelItem(increaseFontSizeButton);
    
    var decreaseFontSizeButton = new Editor.Button('decreaseFontSize', 'Decrease font size (Alt+-)', 'icons/cc_mono/round_minus_icon&16.png', false, function() {
        var oldContent = Editor.view.container.html();
        document.execCommand('decreaseFontSize', false, null); //this feature works only in FF
        var newContent = Editor.view.container.html();
        
        if (oldContent != newContent) { //check if document.execCommand changed something in editor
            return;
        }
        else { //if no, it's not FF and we have to change font size manually
            var nodeThatCursorIsInside = Editor.selection.getRangeAt(0).endContainer.parentNode;
            var tagName = nodeThatCursorIsInside.tagName.toLowerCase();
            var size = nodeThatCursorIsInside.size || 3;
            if (tagName == 'font') {
                if (size > 1) {
                    size--;
                    document.execCommand('fontSize', false, size);
                }
            }
            else {
                document.execCommand('fontSize', false, size);
            }
        }
    });
    Editor.addPanelItem(decreaseFontSizeButton);

    Editor.addPanelItem(new Editor.Separator());
    
    var ulButton = new Editor.Button('ul', 'Insert unordered list', 'icons/cc_mono/list_bullets_icon&16.png', false, function() {
        document.execCommand('insertUnorderedList', false, null);
    });
    Editor.addPanelItem(ulButton);
    
    var olButton = new Editor.Button('ol', 'Insert ordered list', 'icons/cc_mono/list_num_icon&16.png', false, function() {
        document.execCommand('insertOrderedList', false, null);
    });
    Editor.addPanelItem(olButton);
    
    Editor.addPanelItem(new Editor.Separator());
    
    var makeEverythingLookCuteButton = new Editor.Button('cute', 'Make everything look cute', 'icons/cc_mono/heart_icon&16.png', true, function() {
        document.execCommand('fontName', false, 'Comic Sans MS');  
        document.execCommand('bold', false, false);
        document.execCommand('italic', false, false);
        document.execCommand('underline', false, false);
        document.execCommand('foreColor', false, '#ff00e1');
    });
    Editor.addPanelItem(makeEverythingLookCuteButton);
    
    Editor.addPanelItem(new Editor.Separator());
    
    var removeFormatButton = new Editor.Button('removeFormat', 'Remove format', 'icons/cc_mono/round_delete_icon&16.png', false, function() {
        document.execCommand('removeFormat', false, null);
    });
    Editor.addPanelItem(removeFormatButton);
    
    
    //Woohoo
    Editor.init();    

    
    
    // ************ EVENTS ************ //

    Editor.view.container.on('focus', Editor.highlight);
    Editor.view.container.on('blur', Editor.unhighlight);
    Editor.view.panel.on('click', Editor.highlight);
    Editor.view.container.on('click', Editor.activateButtons);
    
    Editor.view.container.on('mouseup', function() {
        Editor.selection = window.getSelection();
    });
    
    Editor.view.container.on('keydown', function(e) {
        var keycode = e.which;
         if (e.ctrlKey) {
            if (keycode == 90) {
                e.preventDefault();
                console.log('ctrl+z');
                Editor.goBackInHistory();
            }
            if (keycode == 89) {
                e.preventDefault();
                console.log('ctrl+r');
                Editor.goForwardInHistory();
            }
         }
    });
    
    Editor.view.container.on('keyup', function(e) {
        var keycode = e.which;

         //Font-format keys
         if (e.altKey) {   
             if (keycode == 66) {
                 var button = Editor.getButtonByName('b');
                 button.view.click();
             }
             else if (keycode == 73) {
                 var button = Editor.getButtonByName('i');
                 button.view.click();
             }
             else if (keycode == 83) {
                 var button = Editor.getButtonByName('strike');
                 button.view.click();
             }
             else if (keycode == 85) {
                 var button = Editor.getButtonByName('u');
                 button.view.click();
             }
             else if (keycode == 61) {
                 var button = Editor.getButtonByName('increaseFontSize');
                 button.view.click();
             }
             else if (keycode == 173) {
                 var button = Editor.getButtonByName('decreaseFontSize');
                 button.view.click();
             }
         }
        
        if (keycode >= 33 && keycode <= 40 || keycode == 8 || keycode == 46) { //arrows, Home, PgUp, PgDown, End, BackSpace, Delete
            Editor.activateButtons();
        }
            
        Editor.addHistotyState();
    });    
    
    Editor.view.container.on('dragenter', function() {
        Editor.highlight();
        Editor.dragHighlight();   
    });
    
    Editor.view.container.on('dragleave', function() {
        Editor.dragUnhighlight();   
    });
    
    Editor.view.container.on('drop', function(e) {
        e.preventDefault();
        
        Editor.dragUnhighlight();
      //  console.log('dropped!');
      //  console.log(e);
        var dropPosition = {
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY
        }
        
        var file = e.originalEvent.dataTransfer.files[0];
        
      //  console.log(file);
        if (/image\/*/.exec(file.type)) {
            var reader = new FileReader();
            
            reader.onload = (function(theFile) {
                var dataURI = theFile.target.result;
                var imageToAppend = document.createElement("img");
                imageToAppend.src = dataURI;
                
                //append image on caret positions
                if (document.caretPositionFromPoint) { //FF
                  //  console.log(dropPosition);
                    var caretPosition = document.caretPositionFromPoint(dropPosition.x, dropPosition.y);
                    var range = document.createRange();
                    range.setStart(caretPosition.offsetNode, caretPosition.offset);
                    range.collapse();
                    range.insertNode(imageToAppend);
                }
                else if (document.caretRangeFromPoint) { //Webkit
                    var range = document.caretRangeFromPoint(dropPosition.x, dropPosition.y);
                    range.insertNode(imageToAppend);
                }
                else {
                    Editor.view.container.append(imageToAppend);
                }
            });

            reader.readAsDataURL(file)
        }
        
        Editor.addHistotyState();
    });
    
    Editor.view.on('click', function(e) {
        e.stopPropagation(); //so click on the editor won't bubble to body and unfocus the editor
    });
    $('body').on('click', function(e) {
        Editor.unhighlight();
    });
    
    $(document).on('ready', function() {
        Editor.sizeToWindow();
        Editor.focus();
    });
    
    $(window).on('resize', function() {
        Editor.sizeToWindow();
    });
});