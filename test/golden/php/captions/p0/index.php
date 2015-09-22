<html>
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js">
    </script>
    <link rel="stylesheet"
          href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
    <link rel="stylesheet"
          href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js">
    </script>
    <script src="https://cdnapisec.kaltura.com/p/1760921/sp/176092100/embedIframeJs/uiconf_id/30633631/partner_id/1760921"></script>
  </head>
  <body>
    <div class="container" style="margin-top:40px">
      <h1>Upload Captions</h1>
      <label>Caption File (SRT)</label>
      <form id="UploadForm">
        <input type="file" name="fileData"></input>
        <input type="submit" value="Upload"></input>
      </form>
      <div id="UploadDone"></div>

      <script>
        $('#UploadForm').submit(function() {
          var data = new FormData(document.getElementById('UploadForm'));
          $.ajax({
            url: '/attachCaptions.php',
            type: 'POST',
            data: data,
            mimeType: "multipart/form-data",
            contentType: false,
            cache: false,
            processData: false,
            success: function (data, textStatus, jqXHR) {
              $('#UploadDone').html(data);
            }
          });
          return false;
        })
      </script>

    </div>
    <script>
      $(".container").on('click', "a[data-action]", function(event) {
        var el = $(event.target);
        var action = el.attr('data-action');
        var view = el.attr('data-view');
        eval('var answers = ' + el.attr('data-answers'));
        el.parent().load(action + '.php', answers);
      })
    </script>
  </body>
</html>
