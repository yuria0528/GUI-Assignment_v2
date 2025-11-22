/* jQuery-based front-end prototype for Order System */
/* Data + localStorage keys */
const sampleToys = [
  { id: "t1", name: "Sunny Bear", desc: "Soft plush bear, customizable color", price: 120, img: "https://picsum.photos/seed/bear/400/300" },
  { id: "t2", name: "Joy Robot", desc: "Plastic robot toy with fabric parts", price: 180, img: "https://picsum.photos/seed/robot/400/300" },
  { id: "t3", name: "Dream Bunny", desc: "Cute bunny, personalized embroidery available", price: 140, img: "https://picsum.photos/seed/bunny/400/300" }
];

const demoUsers = [
  { role: "customer", username: "alice01", email: "alice@example.com", password: "Password123!", name: "Alice Lee", phone: "9123-4567" },
  { role: "customer", username: "bob02", email: "bob@example.com", password: "Secret456!", name: "Bob Chan", phone: "9123-8901" },
  { role: "sales", username: "sales01", email: "sales1@sstoys.com", password: "SalesPass789!", name: "Chan Manager", staffNo: "S001" }
];

const STORAGE = {
  wishlistKey: "ss_wishlist_v1",
  ordersKey: "ss_orders_v1",
  userKey: "ss_user_v1"
};

function getCurrentUser(){ return JSON.parse(localStorage.getItem(STORAGE.userKey) || "null"); }
function setCurrentUser(u){ localStorage.setItem(STORAGE.userKey, JSON.stringify(u)); }
function logout(){ localStorage.removeItem(STORAGE.userKey); }

function getWishlist(){ return JSON.parse(localStorage.getItem(STORAGE.wishlistKey) || "[]"); }
function saveWishlist(list){ localStorage.setItem(STORAGE.wishlistKey, JSON.stringify(list)); }

function getOrders(){ return JSON.parse(localStorage.getItem(STORAGE.ordersKey) || "[]"); }
function saveOrders(list){ localStorage.setItem(STORAGE.ordersKey, JSON.stringify(list)); }

/* Catalog rendering */
function initCatalog(){
  const $catalog = $("#catalog");
  if(!$catalog.length) return;
  const $tpl = $($("#productTpl").html());
  sampleToys.forEach(t=>{
    const $node = $tpl.clone();
    $node.find(".p-image").attr("src", t.img);
    $node.find(".p-name").text(t.name);
    $node.find(".p-desc").text(t.desc);
    $node.find(".p-price").text("HK$ " + t.price);
    $node.find(".customizeBtn").on("click", ()=>openCustomizeModal(t));
    $catalog.append($node);
  });
}

/* Modal */
let currentCustomizeToy = null;
function openCustomizeModal(toy){
  currentCustomizeToy = toy;
  $("#modalTitle").text("Customize: " + toy.name);
  $("#optColor").val("");
  $("#optQty").val(1);
  $("#optSketch").val("");
  $("#modal").removeClass("hide");
}
function closeModal(){ $("#modal").addClass("hide"); }

function initModalBindings(){
  const $modal = $("#modal");
  if(!$modal.length) return;
  $modal.find(".closeBtn").on("click", closeModal);
  $("#customForm").on("submit", function(e){
    e.preventDefault();
    const color = $("#optColor").val().trim();
    const material = $("#optMaterial").val();
    const qty = parseInt($("#optQty").val(),10) || 1;
    const sketch = $("#optSketch").val().trim();
    addToWishlist({
      toyId: currentCustomizeToy.id,
      name: currentCustomizeToy.name,
      price: currentCustomizeToy.price,
      color, material, qty, sketch
    });
    closeModal();
    alert("Added to wishlist");
    renderWishlist();
  });
}

/* Wishlist management */
function addToWishlist(item){
  const list = getWishlist();
  list.push({ id: "w"+Date.now(), ...item });
  saveWishlist(list);
}
function renderWishlist(){
  const $container = $("#wishlistContainer");
  if(!$container.length) return;
  const list = getWishlist();
  $container.empty();
  if(list.length===0){ $container.html("<p>Your wishlist is empty.</p>"); return; }
  list.forEach(w=>{
    const $el = $(`<div class="wishlist-item">
      <div style="flex:1">
        <strong>${w.name}</strong><div>Color: ${w.color} • Material: ${w.material} • Qty: ${w.qty}</div>
        ${w.sketch ? `<div>Sketch: <a href="${w.sketch}" target="_blank">link</a></div>` : ""}
      </div>
      <div>
        <button class="btn small removeBtn" data-id="${w.id}">Remove</button>
      </div>
    </div>`);
    $el.find(".removeBtn").on("click", function(){ removeWish($(this).data("id")); });
    $container.append($el);
  });
}
function removeWish(id){
  const list = getWishlist().filter(i=>i.id!==id);
  saveWishlist(list);
  renderWishlist();
}

/* Submit purchase request -> create order */
function initWishlistSubmit(){
  const $form = $("#submitRequestForm");
  if(!$form.length) return;
  $form.on("submit", function(e){
    e.preventDefault();
    const payment = $("#paymentMethod").val();
    const user = getCurrentUser();
    if(!user){ $("#wishMsg").text("請先登入以提交請求。"); return; }
    const wishlist = getWishlist();
    if(wishlist.length===0){ $("#wishMsg").text("Wishlist is empty."); return; }
    createOrder(user, wishlist, payment);
    saveWishlist([]); renderWishlist();
    $("#wishMsg").text("Request submitted. Check Order Status for updates.");
  });
}

function createOrder(user, items, payment){
  const orders = getOrders();
  const id = "ORD"+Date.now();
  const newOrder = {
    id, userEmail: user.email, userName: user.name, items, payment, status: "Received", createdAt:new Date().toISOString()
  };
  orders.push(newOrder);
  saveOrders(orders);
  renderOrdersList();
  renderSalesRequests();
}

/* Order status page */
function renderOrdersList(){
  const $container = $("#ordersList");
  if(!$container.length) return;
  const user = getCurrentUser();
  const all = getOrders();
  let list = all;
  if(user && user.role==="customer"){
    list = all.filter(o=>o.userEmail === user.email);
  }
  $container.empty();
  if(list.length===0){ $container.html("<p>No orders yet.</p>"); return; }
  list.forEach(o=>{
    const $el = $(`<div class="card" style="margin-bottom:10px;">
      <h4>Order ${o.id} — ${o.status}</h4>
      <div>Customer: ${o.userName} (${o.userEmail})</div>
      <div>Created: ${new Date(o.createdAt).toLocaleString()}</div>
      <div>Items: ${o.items.map(i=>`${i.name} ×${i.qty}`).join(", ")}</div>
    </div>`);
    $container.append($el);
  });
}

/* Sales dashboard */
function renderSalesRequests(){
  const $container = $("#salesRequests");
  if(!$container.length) return;
  const all = getOrders();
  $container.empty();
  if(all.length===0){ $container.html("<p>No requests.</p>"); return; }
  all.forEach(o=>{
    const $el = $(`<div class="card" style="margin-bottom:10px;">
      <h4>${o.id} — ${o.status}</h4>
      <div>Customer: ${o.userName} (${o.userEmail})</div>
      <div>Items: ${o.items.map(i=>`${i.name} ×${i.qty}`).join(", ")}</div>
      <div style="margin-top:8px">
        <select data-id="${o.id}" class="statusSelect">
          <option ${o.status==="Received"?"selected":""}>Received</option>
          <option ${o.status==="Processing"?"selected":""}>Processing</option>
          <option ${o.status==="Confirmed"?"selected":""}>Confirmed</option>
          <option ${o.status==="Shipped"?"selected":""}>Shipped</option>
          <option ${o.status==="Completed"?"selected":""}>Completed</option>
        </select>
        <button class="btn updateBtn" data-id="${o.id}">Update</button>
      </div>
    </div>`);
    $el.find(".updateBtn").on("click", function(){
      const id = $(this).data("id");
      updateOrderStatus(id);
    });
    $container.append($el);
  });
}

function updateOrderStatus(orderId){
  const sel = $(`select[data-id="${orderId}"]`);
  if(!sel.length) return;
  const newStatus = sel.val();
  const all = getOrders();
  const idx = all.findIndex(o=>o.id===orderId);
  if(idx<0) return;
  all[idx].status = newStatus;
  saveOrders(all);
  alert("Order status updated to " + newStatus);
  renderSalesRequests(); renderOrdersList();
}

/* Auth (demo) */
function initAuth(){
  const $loginForm = $("#loginForm");
  if($loginForm.length){
    $loginForm.on("submit", function(e){
      e.preventDefault();
      const email = $("#loginEmail").val().trim();
      const pwd = $("#loginPassword").val();
      const role = $("#loginRole").val();
      const u = demoUsers.find(x=>x.email===email && x.password===pwd && x.role===role);
      const $msg = $("#loginMsg");
      if(u){ setCurrentUser(u); $msg.text("Login successful. Redirecting..."); setTimeout(()=>location.href="index.html",800); }
      else{ $msg.text("Invalid credentials. Check data/USERS.TXT for demo users."); }
    });
  }

  const $regForm = $("#registerForm");
  if($regForm.length){
    $regForm.on("submit", function(e){
      e.preventDefault();
      const name = $("#regName").val().trim();
      const email = $("#regEmail").val().trim();
      const phone = $("#regPhone").val().trim();
      const pwd = $("#regPassword").val();
      const existing = demoUsers.find(u=>u.email===email);
      const $msg = $("#regMsg");
      if(existing){ $msg.text("Email already used in demo."); return; }
      const newUser = { role:"customer", username: email.split("@")[0], email, password: pwd, name, phone };
      demoUsers.push(newUser);
      setCurrentUser(newUser);
      $msg.text("Account created. Redirecting...");
      setTimeout(()=>location.href="index.html",800);
    });
  }
}

/* Init on each page */
$(function(){
  initCatalog();
  initModalBindings();
  initAuth();
  renderWishlist();
  initWishlistSubmit();
  renderOrdersList();
  renderSalesRequests();
});