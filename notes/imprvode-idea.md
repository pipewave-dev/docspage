#
- Close websocket connection đừng xoá vội Record trong active connection manager
    - chỉ nên xoá value, vẫn để key
    - mục đích cho phép instanceID khi reconnect (cùng instanceID) thì có thể điền lại connection mới vào value đó
    - khi vừa bị close, switch sang mode buffer, msg sẽ gửi vào queue thay vì gửi vào websocket
    - khi có connection mới, search key nếu đang có mà value nil -> lấy msg trong queue gửi lại tránh mất message
    
