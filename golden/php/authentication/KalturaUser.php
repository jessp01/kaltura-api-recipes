<?php if($result->partnerId) { ?>
  <h1>Logged In!</h1>
  <p>Email: <?= $result->email ?></p>
  <p>Partner ID: <?= $result->partnerId ?></p>
<?php } ?>