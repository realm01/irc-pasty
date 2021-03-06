var modalCallback = undefined;
var deleteCounter = 0;

var display_modes = [
  'Markdown',
  'Plain Code',
  'Plain Text'
];

var availableTags = [];

function showProgression() {
  $("#progression-div").fadeIn('fast');
}

function hideProgression() {
  $("#progression-div").fadeOut('fast', function() {
    $("#progression-bar").attr("style", "width: 0%;");
  });
}

function fileUploadProgessionHandler(e) {
  if(e.lengthComputable){
        /*
        // e.loaded
        // e.total
        */
        $("#progression-bar").attr("style", "width: " + ((e.loaded / e.total) * 100).toString() + '%;');
    }
}

function initializeFileDeleters() {
  $(".delete-single-file").click(function () {
    $("#modal-yes").data("modal-data", $(this).data("link"));
    $("#modal-yes").data("redirect", "");
    $("#modal-yes").data("modal-method", "GET");
    $("#modal-title").text("Delete File");
    $("#modal-body").html("Do you really want to delete this file?<br>Filename: <b>" + $(this).data("filename") + "</b>");
    modalCallback = function(response) {
      $("#file-container").empty();
      if(response == "") {
        $("#file-container").html("<p>Currently no files saved</p>");
      }else{
        $("#file-container").html(response);
      }
      $("#files").empty();
      $("#files").html('<input class="single-file margin-bottom-1" type="file">');
      initializeFileDeleters();
    };
  });
}

$(window).ready(run);

function neutralMsgIn(message) {
  $("#neutral-msg-text-field").html(message);
  $("#neutral-msg-container").fadeIn('fast');
}

function neutralMsgOut() {
  $("#neutral-msg-container").fadeOut('fast');
}

function showError(message) {
  $("#error-text-field").html(message);
  $("#error-container").fadeIn('fast').delay(2000).fadeOut('fast');
}

function showWarning(message) {
  $("#warning-text-field").html(message);
  $("#warning-container").fadeIn('fast').delay(2000).fadeOut('fast');
}

function showSuccess(message) {
  $("#success-text-field").html(message);
  $("#success-container").fadeIn('fast').delay(2000).fadeOut('fast');
}

function highlight() {
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}

function updateSender() {
  Cookies.set("post_sender", $('#post-sender').val());
}

function setLink(link) {
  $("#pasty-link").html(link);
  $("#pasty-link").attr("href", link);
}

// TODO: write test
function sendData(url, autosave, post_to_channel) {
  if(autosave && $('#preview').data('mode') == 'preview') {
    return 0;
  }

  if($("#input-area").length == 0) {
    return 0;
  }

  if(editor.getValue() == "") {
    if(!autosave) {
      showError("Enter some content to the post");
    }
    return 0;
  }
  if($("#post-title").val() == "") {
    if(!autosave) {
      showError("Specify a title");
    }
    return 0;
  }
  var id = "";
  if($("#post-id").data("post-id") != "") {
    id = $("#post-id").data("post-id");
  }
  neutralMsgIn('Loading ...');
  var data_to_send = {
    'content' : editor.getValue(),
    'title' : $("#post-title").val(),
    'display_mode' : $("#display-mode").data("display-mode")
  };
  if(post_to_channel) {
    data_to_send['irc_channel'] = $("#irc_channel_selected").data("irc-channel");
  }
  var receiver = $('#post-receiver').val();
  if(receiver != "") {
    data_to_send['post_receiver'] = receiver;
  }

  sender = $('#post-sender').val();
  if(!autosave && sender != "") {
    data_to_send['post_sender'] = sender;
  }

  if($('#post-privmsg').prop("checked")) {
    data_to_send['post_privmsg'] = true;
  }

  console.log(data_to_send)

  $.ajax({
    url: url + id,
    method: 'POST',
    dataType: 'text',
    data: data_to_send
  })
  .done(function(response) {
    if(autosave) {
      window.history.replaceState({}, "Pasty", window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/getautosave/' + response);
      $("#post-id").data("post-id", response);
      showSuccess('Autosaved!');
      neutralMsgOut();
    }else{
      setLink(window.location.protocol + '//' + window.location.hostname + '/get/' + response);
      $("#link-container").show();
      $("#post-id").data("post-id", response);

      var form_data = new FormData($("#files")[0]);
      var upload_data = false;
      $(".single-file").each(function () {
        var file = $(this).prop("files")[0];
        if(file != undefined) {
          form_data.append('file', file);
          upload_data = true;
        }
      });

      if(upload_data) {
        showProgression();
        neutralMsgIn('Uploading files ...');
        $.ajax({
          url: '/upload/' + response,
          method: 'POST',
          dataType: 'text',
          data: form_data,
          contentType: false,
          processData: false,
          xhr: function () {
            var this_xhr = $.ajaxSettings.xhr();
            if(this_xhr.upload){
                this_xhr.upload.addEventListener('progress',fileUploadProgessionHandler, false);
            }
            return this_xhr;
          }
        })
        .done(function(response) {
          $("#file-container").empty();
          $("#file-container").html(response);
          $("#files").empty();
          $("#files").html('<input class="single-file margin-bottom-1" type="file">');
          initializeFileDeleters();
          neutralMsgOut();
          showSuccess('Post saved!');
          hideProgression();
        })
        .fail(function(jqXHR, text_status) {
          showError("Failed to upload files");
          hideProgression();
        });
      }
      if(!upload_data) {
        showSuccess('Post saved!');
        neutralMsgOut();
      }
    }
  })
  .fail(function(jqXHR, text_status) {
    neutralMsgOut();
    showError("There was a communication problem with the server");
  });
}

function generateHTML(content) {
  if($("#display-mode").data("display-mode") == 0) {
    var converter = new showdown.Converter();
    return converter.makeHtml(content);
  }else if($("#display-mode").data("display-mode") == 1) {
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<pre><code>' + content + '</code></pre>';
  }else if($("#display-mode").data("display-mode") == 2) {
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;').replace(/\t/g, '&emsp;');
    return content;
  }
}

function displayPost(content) {
  $("#edit-area").hide();
  $("#preview-area").empty();
  $("#preview-area").html(generateHTML(content));
  highlight();
  $("#preview-area").show();
  $("#preview").data("mode", "preview");
  $("#preview").html("Edit");
  $("#post-title").attr('readonly', 'true');
}

function deleteMultipleCallback() {
  neutralMsgOut();
  window.location = '/all';
}

function loadEditorCookies() {
  $('#vimmode').prop('checked', Cookies.get('vimmode') == '1' ? true : false);
  $('#syntax-checking').prop('checked', Cookies.get('syntax-checking') == '1' ? true : false);
  $('#text-wrap').prop('checked', Cookies.get('text-wrap') == '1' ? true : false);
}

function setEditorCookies() {
  var cookie_options = {
    path : '/',
    expires : 365
  };

  Cookies.set("vimmode", $('#vimmode').prop('checked') ? '1' : '0', cookie_options);
  Cookies.set("syntax-checking", $('#syntax-checking').prop('checked') ? '1' : '0', cookie_options);
  Cookies.set("text-wrap", $('#text-wrap').prop('checked') ? '1' : '0', cookie_options);
}

function initializeAutocomplete() {
  function split( val ) {
    return val.split( /,\s*/ );
  }
  function extractLast( term ) {
    return split( term ).pop();
  }

  $( "#post-receiver" )
  .on( "keydown", function( event ) {
    if ( event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active ) {
      event.preventDefault();
    }
  })
  .autocomplete({
    minLength: 0,
    source: function( request, response ) {
      response( $.ui.autocomplete.filter(availableTags, extractLast( request.term ) ) );
    },
    focus: function() {
      return false;
    },
    select: function( event, ui ) {
      var terms = split( this.value );
      terms.pop();
      terms.push( ui.item.value );
      terms.push( "" );
      this.value = terms.join( ", " );
      return false;
    }
  });
}

function updateAutocomplete() {
  var channel = $("#irc-selected").text().slice(1);
  $.ajax({
    url: '/getuserlist/' + channel,
    method: 'GET',
    dataType: 'text',
  }).done(function (reponse) {
    availableTags = JSON.parse(reponse);
  });
}

function run() {
  loadEditorCookies();

  $(".cookie-modifier").click(function () {
    setEditorCookies();
    adaptFeaturesAce();
  });

  $('#post-sender').val(Cookies.get('post_sender'));

  updateAutocomplete();
  initializeAutocomplete();

  setInterval(function() {
    sendData('/autosave/', true, false);
  }, 1000 * 60); // every minute

  setInterval(updateAutocomplete, 1000 * 60);

  if($("#mode-control").data("initial-view-mode") == "show") {
    displayPost(editor.getValue());
    setLink(window.location.href);
    $("#link-container").show();
  }

  $("#display-mode-text").html(display_modes[parseInt($("#display-mode").data("display-mode"))]);

  $("#preview").click(function() {
    if($(this).data("mode") == "edit") {
      sendData('/autosave/', true, false);
      displayPost(editor.getValue());   // get input from ace
      $(this).data("mode", "preview");
      $(this).html("Edit");
    }else{
      $(this).data("mode", "edit");
      $("#preview-area").hide();
      $("#edit-area").show();
      $("#post-title").removeAttr('readonly');
      $(this).html("Preview");
      initializeAce();
    }
  });

  $("#save").click(function() {
    sendData('/save/', false, false);
  });

  $("#save-and-post").click(function() {
    sendData('/save/', false, true);
  });

  $("#display-mode-selector > li > a").click(function () {
    $("#display-mode-text").html($(this).html());
    $("#display-mode").data("display-mode", $(this).data("display-mode"));
    if($("#preview").data("mode") == "preview") {
      displayPost(editor.getValue());
    }
  });

  $("#irc_channels > li > a").click(function () {
    $("#irc-selected").html($(this).html());
    $("#irc_channel_selected").data("irc-channel", $(this).html());
  });

  $("#delete").click(function () {
    if($("#post-id").data("post-id") != "") {
      $("#modal-yes").data("modal-data", "/delete/" + $("#post-id").data("post-id"));
      $("#modal-yes").data("redirect", "/");
      $("#modal-yes").data("modal-method", "POST");
      $("#modal-title").text("Delete");
      modalCallback = undefined;
      $("#modal-body").html("Do you really want to delete this post?<br>Title: <b>" + $("#post-title").val() + "</b>");

      $("#modal-yes,#modal-no").show();
      $("#modal-ok").hide();
    }else{
      $("#modal-yes").data("modal-data", "");
      $("#modal-title").text("Cannot Delete");
      $("#modal-body").html("This post hasn't been saved yet, you cannot delete it");

      $("#modal-yes,#modal-no").hide();
      $("#modal-ok").show();
    }
  });

  $("#modal-yes").click(function () {
    if($("#pasty-modal").hasClass("in") && $("#modal-yes").data("modal-data") == "delete-selected") {
      deleteCounter = $(".to-be-deleted:checked").length;
      $(".to-be-deleted:checked").each(function () {
        neutralMsgIn('Loading ...');
        $.ajax({
          url: $($(this).parent().siblings(".link_div").children("a")[0]).attr("href").replace(/get/, "delete"),
          method: 'POST',
          dataType: 'text',
        })
        .done(function(response) {
          deleteCounter--;
          if(deleteCounter == 0) {
            deleteMultipleCallback();
          }
        })
        .fail(function(jqXHR, text_status) {
          deleteCounter--;

          if(jqXHR.status == 404) {
            showWarning("Post hasn't been saved yet, and therefore cannot be deleted");
          }else{
            showError("There was a communication problem with the server");
          }

          if(deleteCounter == 0) {
            deleteMultipleCallback();
          }
        });
      });
    }else if($("#pasty-modal").hasClass("in") && $("#modal-yes").data("modal-data") != "") {
      neutralMsgIn('Loading ...');
      url = $(this).data("modal-data");
      if(url != "") {
        $.ajax({
          url: url,
          method: $("#modal-yes").data("modal-method"),
          dataType: 'text',
        })
        .done(function(response) {
          redirect = $("#modal-yes").data("redirect");
          if(redirect != "") {
            window.location = redirect;
          }

          if(modalCallback != undefined) {
            modalCallback(response);
          }

          initializeFileDeleters();
          neutralMsgOut();
        })
        .fail(function(jqXHR, text_status) {
          neutralMsgOut();
          if(jqXHR.status == 404) {
            showWarning("Post hasn't been saved yet, and therefore cannot be deleted");
          }else{
            showError("There was a communication problem with the server");
          }
        });
      }
    }
  });

  $("#delete-selected").click(function () {
    $("#modal-yes").data("modal-data", "delete-selected");
    $("#modal-title").text("Delete Selected");
    $("#modal-body").html("Do you want to delete all selected posts?");
  });

  $("#attach-more").click(function () {
    var attach_more = true;
    $(".single-file").each(function () {
      if($(this).prop("files")[0] == undefined) {
        attach_more = false;
      }
    });

    if(attach_more) {
      $("#files").append('<input class="single-file margin-bottom-1" type="file">');
    }
  });

  var clicked_on_a = false;

  $("a,input").click(function () {
    clicked_on_a = true;
  });

  $(".post-all-column").click(function () {
    if(!clicked_on_a) {
      location.href = $(this).find("a").attr("href");
    }else{
      clicked_on_a = false;
    }
  });

  var all_selected = false;
  $("#select-all").click(function () {
    all_selected = !all_selected;
    $(".to-be-deleted").prop("checked", all_selected);

    if(all_selected) {
      $("#select-all").text("Unselect All");
    }else{
      $("#select-all").text("Select All");
    }
  });

  initializeFileDeleters();
}
