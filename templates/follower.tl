<li class="follower">
  <span class="enemy-class"><%= type %></span>
  <span>Offset of leader</span> x:<input type="text" style="width:30px" class="x" /> y:<input style="width:30px" type="text" class="y" />
  <span>Trailing Time:</span><input type="text" style="width:30px" class="trailing-time" /> ticks
  <button class="clone-follower" data-control="clone-follower" data-type="<%= type %>">Clone</button>
  <button data-control="remove-follower">Remove</button>
  <button data-control="add-weapon">Add weapon</button>
  <ul class="weapons"></ul>
</li>