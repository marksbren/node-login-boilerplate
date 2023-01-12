var refreshButton = setInterval(updateButton, 1000);
var theDiv = document.getElementById("resendButton");
var nextSend = parseInt(theDiv.getAttribute("tegdb"));

function updateButton(){
  seconds_left = Math.round((nextSend - Date.now())/1000)
  if(seconds_left<0){
    clearInterval(refreshButton);
    theDiv.innerHTML = "Resend";
    theDiv.removeAttribute("disabled");
  }else{
    theDiv.innerHTML = "Resend " + "(" + seconds_left + "s)"
    theDiv.setAttribute("disabled", "");
  }
  
}