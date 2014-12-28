<li class="enemy">
  <fieldset>
    <legend>Enemy</legend>
    <label for="entitySelect_<%=gid %>">Enemy Type</label><select class="entity-select" data-control="entitySelect" id="entitySelect_<%=gid %>" name="entity_<%= gid %>"></select>        
    <fieldset>
      <legend>Animation</legend>
      <button data-control="play" class="play" data-play-entity="Enemy<%= gid %>">Play</button>
      <button data-control="stop" class="stop" DISABLED=DISABLED data-play-entity="Enemy<%= gid %>">Stop</button>
      <button data-control="add-directive" class="add-directive" data-play-entity="Enemy<%= gid %>">Add Directive</button>
      <ul class="directives">
        <li class="directive">
          <label for="entitySpeed_<%=gid %>">Speed</label><input data-control="entitySpeed" class="entity-speed" type="text" id="entitySpeed_<%= gid %>" data-range-slider="range-slider_<%= gid %>" />
          <input data-control="entityPosition" id="range-slider_<%= gid %>" class="placement" DISABLED value="0" data-entity-position="Enemy<%= gid %>" type="range" />
          <button class="remove" DISABLED=DISABLED data-control="remove">Remove</button>
        </li>
      </ul>
    </fieldset>
    <fieldset>
      <legend>Followers</legend>
      <label for="entitySelect_<%=gid %>">Enemy Type</label><select class="entity-select" data-control="enemyFollowerSelect" id="entitySelect_<%=gid %>" name="entity_<%= gid %>"></select>        
    </fieldset>    
  </fieldset>
</li>