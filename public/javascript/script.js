// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

  function adjustGuestCount(change) {
    const input = document.getElementById('guestCount');
    let count = parseInt(input.value) || 1;
    count += change;
    if (count < 1) count = 1;
    input.value = count;
  }

  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();        // prevents default behavior
      e.stopPropagation();       // stops <a> from being triggered

      const listingId = btn.dataset.id;
      const icon = btn.querySelector('i');

      try {
        const res = await fetch(`/wishlist/${listingId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          icon.classList.toggle('fas');
          icon.classList.toggle('far');
        }
      } catch (err) {
        console.error('Error toggling wishlist:', err);
      }
    });
  });