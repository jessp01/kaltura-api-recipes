<?php
  require "AddCodeCuePointForm.php";
?>
<script>
  $('#AddCodeCuePointForm').submit(function() {
    var data = new FormData(document.getElementById('AddCodeCuePointForm'));
     $.ajax({
       url: '/addCodeCuePoint.php',
       type: 'POST',
       data: data,
       contentType: false,
       cache: false,
       processData: false,
       success: function (data, textStatus, jqXHR) {
         $('.container').html(data);
       }
     });
    return false;
  })
</script>