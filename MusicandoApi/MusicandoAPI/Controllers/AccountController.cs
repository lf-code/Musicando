using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using MusicandoAPI.Models;

namespace MusicandoAPI.Controllers
{

    [Authorize]
#if DEBUG
    [EnableCors("AllowSpecificOrigin")]
#endif
    public class AccountController : Controller
    {
        private readonly MyDbContext _context;
        private readonly UserManager<MyUser> _userManager;
        private readonly SignInManager<MyUser> _signInManager;

        public AccountController(UserManager<MyUser> userManager, SignInManager<MyUser> signInManager, MyDbContext context)
        {
            _context = context;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        /// <summary>
        /// Creates a new user, if input model is valid. Otherwise, returns an object
        /// containing the errors that occured.
        /// </summary>
        [HttpPost("/api/user/registar")]
        [AllowAnonymous]
        [ProducesResponseType(200, Type = typeof(UserBasicVM))]
        [ProducesResponseType(400, Type = typeof(RegisterErrorVM))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Register([FromBody] RegisterBM registerModel)
        {
            // keep track of validation errors to inform client of what went wrong
            RegisterErrorVM validationErrors = new RegisterErrorVM();

            // validate registerModel (automatic through attribute validation):
            if (!ModelState.IsValid)
            {
                // fill in validationErrors object and return it within a 'Bad request' response.
                validationErrors.InvalidEmail = ModelState.GetValidationState("Email") == Microsoft.AspNetCore.Mvc.ModelBinding.ModelValidationState.Invalid;
                validationErrors.InvalidUsername = ModelState.GetValidationState("Username") == Microsoft.AspNetCore.Mvc.ModelBinding.ModelValidationState.Invalid;
                validationErrors.InvalidPassword = ModelState.GetValidationState("Password") == Microsoft.AspNetCore.Mvc.ModelBinding.ModelValidationState.Invalid;
                validationErrors.InvalidConfirmPassword = ModelState.GetValidationState("ConfirmPassword") == Microsoft.AspNetCore.Mvc.ModelBinding.ModelValidationState.Invalid;
                return BadRequest(validationErrors); 
            }

            // the registerModel is valid but the email already exists:
            if (await _userManager.FindByEmailAsync(registerModel.Email) != null)
            {
                validationErrors.ExistingEmail = true;
                return BadRequest(validationErrors);
            }

            // the registerModel is valid, the email is unique, but username already exists:
            if (await _userManager.FindByNameAsync(registerModel.Username) != null)
            {
                validationErrors.ExistingUsername = true;
                return BadRequest(validationErrors);
            }

            // password and confirmPassword, although valid, do not match:
            if (registerModel.Password.CompareTo(registerModel.ConfirmPassword) != 0)
            {
                validationErrors.PasswordsDoNotMatch = true;
                return BadRequest(validationErrors);
            }

            // registration data was validated, try to create user:
            var user = new MyUser { UserName = registerModel.Username, Email = registerModel.Email };
            var result = await _userManager.CreateAsync(user, registerModel.Password);

            if (result.Succeeded)
            {
                //user was successfully created

                //initialize his playlist of private songs:
                user.Playlists = new List<Playlist>();

                Playlist p = new Playlist("Músicas Privadas", user);
                user.Playlists.Add(p);
                user.PrivateSongPlaylist = new PrivateSongPlaylist();
                user.PrivateSongPlaylist.Playlist = p;
                
                await _context.SaveChangesAsync();

                //do not automatically sign in, client app will request it upon successful registration
                //await _signInManager.SignInAsync(user, isPersistent: false);

                return Ok(new UserBasicVM(user.UserName));
            }
            else
                return BadRequest();
        }


        /// <summary>
        /// Enables anounymous users to authenticate themselves. 
        /// </summary>
        [HttpPost("/api/user/login")]
        [AllowAnonymous]
        [ProducesResponseType(200, Type = typeof(UserBasicVM))]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Login([FromBody] LoginBM loginModel)
        {
            //if username and password are valid strings, try to login. Otherwise, return BadRequest.
            if (ModelState.IsValid)
            {
                var result = await _signInManager.PasswordSignInAsync(loginModel.Username, loginModel.Password, isPersistent: false, lockoutOnFailure: false);

                if (result.Succeeded)
                    return Ok(new UserBasicVM(loginModel.Username)); 
                else
                    return Unauthorized(); //valid but wrong credentials
            }

            return BadRequest(); //invalid credentials
        }


        /// <summary>
        /// Enables an authenticated user to change its password. He must provide its current password.
        /// </summary>
        [HttpPost("/api/user/mudarpassword")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordBM model)
        {
            
            if (!ModelState.IsValid)
                return BadRequest();
            
            if (model.NewPassword.CompareTo(model.ConfirmNewPassword) != 0)
                return BadRequest(); // NewPassword and ConfirmPassword are valid but do not match

            MyUser user = _context.Users.Cast<MyUser>().Single(x => x.UserName == HttpContext.User.Identity.Name);

            if (user == null)
                return BadRequest(); 

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (!result.Succeeded)
                return BadRequest(); //current password is incorrect

            return Ok();
        }


        /// <summary>
        /// Enables an authenticated user to delete its account. He must provide his credentials.
        /// </summary>
        [HttpPost("/api/user/apagarconta")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> DeleteAccount([FromBody] LoginBM credentials)
        {
            //check if username and password are valid strings:
            if (!ModelState.IsValid)
                return BadRequest();

            MyUser user = _context.Users.Cast<MyUser>().Single(x => x.UserName == HttpContext.User.Identity.Name);

            if (user == null)
                return BadRequest();

            //check if credentials are correct:
            if (!(await _userManager.CheckPasswordAsync(user, credentials.Password)))
                return Unauthorized();

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest();

            return Ok();

        }


        /// <summary>
        /// Enables an authenticated user to logout.
        /// </summary>
        [HttpPost("/api/user/logout")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }


        /// <summary>
        /// Returns an 'Unauthorized' response when users try to access 
        /// resources for which they do not have authorization.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("/api/user/accessdenied")]
        [ProducesResponseType(401)]
        public IActionResult AccessDenied()
        {
            return Unauthorized();
        }

    }


}